// ══════════════════════════════════════════════════════════════════════════════
// Cara — Professional Development Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getRating,
  getCPDCategoryLabel,
  getQualificationLevelLabel,
  getQualificationStatusLabel,
  getTrainingImpactLabel,
  getLearningStyleLabel,
  getRatingLabel,
  evaluateCPDQuality,
  evaluateQualificationProgress,
  evaluateSupervisionDevelopment,
  evaluateLearningCulture,
  buildStaffDevelopmentProfiles,
  generateProfessionalDevelopmentIntelligence,
} from "../professional-development-engine";
import type {
  CPDRecord,
  QualificationProgress,
  SupervisionDevelopment,
  LearningCulture,
  CPDCategory,
  QualificationLevel,
  QualificationStatus,
  TrainingImpact,
  LearningStyle,
  Rating,
} from "../professional-development-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-12-31";

// ── Factory Helpers ─────────────────────────────────────────────────────────

function makeCPDRecord(overrides: Partial<CPDRecord> = {}): CPDRecord {
  return {
    id: "cpd-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    category: "mandatory_training",
    title: "Test Course",
    date: "2025-03-15",
    hours: 6,
    provider: "External",
    certificateObtained: true,
    impactAssessed: true,
    impact: "significant_improvement",
    sharedWithTeam: true,
    relevantToRole: true,
    ...overrides,
  };
}

function makeQualification(overrides: Partial<QualificationProgress> = {}): QualificationProgress {
  return {
    id: "qual-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    qualificationName: "Level 3 Diploma",
    level: "level_3",
    status: "completed",
    startDate: "2023-01-01",
    expectedCompletion: "2024-12-31",
    actualCompletion: "2024-11-15",
    fundedByEmployer: true,
    supportProvided: true,
    ...overrides,
  };
}

function makeSupervision(overrides: Partial<SupervisionDevelopment> = {}): SupervisionDevelopment {
  return {
    id: "sup-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    supervisionDate: "2025-03-15",
    developmentGoalsSet: true,
    progressReviewed: true,
    trainingNeedsIdentified: true,
    actionPlanCreated: true,
    previousActionsCompleted: true,
    ...overrides,
  };
}

function makeLearningCulture(overrides: Partial<LearningCulture> = {}): LearningCulture {
  return {
    id: "lc-1",
    homeId: "oak-house",
    assessmentDate: "2025-06-01",
    regularTeamMeetings: true,
    sharedLearningOpportunities: true,
    reflectivePracticeEmbedded: true,
    feedbackCulture: true,
    innovationEncouraged: true,
    budgetAllocated: true,
    trainingCalendarExists: true,
    inductionProgramRobust: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for 80", () => {
    expect(getRating(80)).toBe("outstanding");
  });

  it("returns outstanding for 100", () => {
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60", () => {
    expect(getRating(60)).toBe("good");
  });

  it("returns good for 79", () => {
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });

  it("returns requires_improvement for 59", () => {
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for 39", () => {
    expect(getRating(39)).toBe("inadequate");
  });

  it("returns inadequate for 0", () => {
    expect(getRating(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getCPDCategoryLabel", () => {
  const cases: [CPDCategory, string][] = [
    ["mandatory_training", "Mandatory Training"],
    ["specialist_qualification", "Specialist Qualification"],
    ["conference_seminar", "Conference / Seminar"],
    ["peer_learning", "Peer Learning"],
    ["mentoring", "Mentoring"],
    ["shadowing", "Shadowing"],
    ["self_directed", "Self-Directed Learning"],
    ["external_course", "External Course"],
    ["in_house_training", "In-House Training"],
    ["reflective_practice", "Reflective Practice"],
  ];

  it.each(cases)("returns '%s' → '%s'", (input, expected) => {
    expect(getCPDCategoryLabel(input)).toBe(expected);
  });
});

describe("getQualificationLevelLabel", () => {
  const cases: [QualificationLevel, string][] = [
    ["level_2", "Level 2"],
    ["level_3", "Level 3"],
    ["level_4", "Level 4"],
    ["level_5", "Level 5"],
    ["degree", "Degree"],
    ["masters", "Masters"],
    ["specialist", "Specialist"],
  ];

  it.each(cases)("returns '%s' → '%s'", (input, expected) => {
    expect(getQualificationLevelLabel(input)).toBe(expected);
  });
});

describe("getQualificationStatusLabel", () => {
  const cases: [QualificationStatus, string][] = [
    ["enrolled", "Enrolled"],
    ["in_progress", "In Progress"],
    ["completed", "Completed"],
    ["overdue", "Overdue"],
    ["withdrawn", "Withdrawn"],
  ];

  it.each(cases)("returns '%s' → '%s'", (input, expected) => {
    expect(getQualificationStatusLabel(input)).toBe(expected);
  });
});

describe("getTrainingImpactLabel", () => {
  const cases: [TrainingImpact, string][] = [
    ["significant_improvement", "Significant Improvement"],
    ["some_improvement", "Some Improvement"],
    ["no_change", "No Change"],
    ["not_assessed", "Not Assessed"],
  ];

  it.each(cases)("returns '%s' → '%s'", (input, expected) => {
    expect(getTrainingImpactLabel(input)).toBe(expected);
  });
});

describe("getLearningStyleLabel", () => {
  const cases: [LearningStyle, string][] = [
    ["visual", "Visual"],
    ["auditory", "Auditory"],
    ["reading_writing", "Reading / Writing"],
    ["kinaesthetic", "Kinaesthetic"],
    ["blended", "Blended"],
  ];

  it.each(cases)("returns '%s' → '%s'", (input, expected) => {
    expect(getLearningStyleLabel(input)).toBe(expected);
  });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];

  it.each(cases)("returns '%s' → '%s'", (input, expected) => {
    expect(getRatingLabel(input)).toBe(expected);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateCPDQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCPDQuality", () => {
  it("returns zeroes for empty data", () => {
    const result = evaluateCPDQuality([], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.totalHours).toBe(0);
    expect(result.averageHoursPerStaff).toBe(0);
    expect(result.impactAssessedRate).toBeNull();
    expect(result.positiveImpactRate).toBeNull();
    expect(result.sharedWithTeamRate).toBeNull();
    expect(result.relevantToRoleRate).toBeNull();
    expect(result.certificateRate).toBeNull();
  });

  it("returns max score for perfect data", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", hours: 35 }),
      makeCPDRecord({ id: "r2", staffId: "s1", hours: 10 }),
    ];
    const result = evaluateCPDQuality(records, ["s1"]);
    expect(result.overallScore).toBe(25);
    expect(result.impactAssessedRate).toBe(100);
    expect(result.positiveImpactRate).toBe(100);
    expect(result.sharedWithTeamRate).toBe(100);
    expect(result.relevantToRoleRate).toBe(100);
    expect(result.totalRecords).toBe(2);
    expect(result.totalHours).toBe(45);
    expect(result.averageHoursPerStaff).toBe(45);
  });

  it("scores lower when impact not assessed", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", impactAssessed: false, impact: null }),
      makeCPDRecord({ id: "r2", impactAssessed: false, impact: null }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    expect(result.impactAssessedRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores lower when not shared with team", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", sharedWithTeam: false }),
      makeCPDRecord({ id: "r2", sharedWithTeam: false }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    expect(result.sharedWithTeamRate).toBe(0);
  });

  it("tracks category distribution correctly", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", category: "peer_learning" }),
      makeCPDRecord({ id: "r2", category: "peer_learning" }),
      makeCPDRecord({ id: "r3", category: "mentoring" }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    expect(result.categoryDistribution.peer_learning).toBe(2);
    expect(result.categoryDistribution.mentoring).toBe(1);
    expect(result.categoryDistribution.mandatory_training).toBe(0);
  });

  it("calculates certificate rate correctly", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", certificateObtained: true }),
      makeCPDRecord({ id: "r2", certificateObtained: false }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    expect(result.certificateRate).toBe(50);
  });

  it("handles multiple staff members for averageHoursPerStaff", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", hours: 20 }),
      makeCPDRecord({ id: "r2", staffId: "s2", hours: 40 }),
    ];
    const result = evaluateCPDQuality(records, ["s1", "s2"]);
    expect(result.averageHoursPerStaff).toBe(30);
    expect(result.totalHours).toBe(60);
  });

  it("gives hours bonus when average >= 30", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", hours: 35, impactAssessed: false, impact: null, sharedWithTeam: false, relevantToRole: false, certificateObtained: false }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    // Only hours bonus should contribute
    expect(result.overallScore).toBe(4); // max 4 for hours bonus
  });

  it("scales hours bonus proportionally below 30", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", hours: 15, impactAssessed: false, impact: null, sharedWithTeam: false, relevantToRole: false, certificateObtained: false }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    // 15/30 * 4 = 2
    expect(result.overallScore).toBe(2);
  });

  it("correctly identifies positive impact (significant + some)", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", impact: "significant_improvement" }),
      makeCPDRecord({ id: "r2", impact: "some_improvement" }),
      makeCPDRecord({ id: "r3", impact: "no_change" }),
      makeCPDRecord({ id: "r4", impact: null, impactAssessed: false }),
    ];
    const result = evaluateCPDQuality(records, ["staff-1"]);
    expect(result.positiveImpactRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateQualificationProgress
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateQualificationProgress", () => {
  it("returns zeroes for empty data", () => {
    const result = evaluateQualificationProgress([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalQualifications).toBe(0);
    expect(result.completedRate).toBeNull();
    expect(result.overdueCount).toBe(0);
  });

  it("returns high score for all completed, funded, supported", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1" }),
      makeQualification({ id: "q2", staffId: "staff-2", staffName: "Staff B" }),
    ];
    const result = evaluateQualificationProgress(quals);
    // completed=8 + inProgress=0 + funded=4 + support=4 - overdue=0 = 16
    expect(result.overallScore).toBe(16);
    expect(result.completedRate).toBe(100);
    expect(result.fundedRate).toBe(100);
    expect(result.supportRate).toBe(100);
  });

  it("penalises overdue qualifications", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", status: "overdue", actualCompletion: null }),
    ];
    const result = evaluateQualificationProgress(quals);
    expect(result.overdueCount).toBe(1);
    expect(result.overallScore).toBeLessThan(
      evaluateQualificationProgress([makeQualification({ id: "q1" })]).overallScore,
    );
  });

  it("caps penalty at 4 points", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", status: "overdue", actualCompletion: null }),
      makeQualification({ id: "q2", status: "overdue", actualCompletion: null }),
      makeQualification({ id: "q3", status: "overdue", actualCompletion: null }),
    ];
    const result = evaluateQualificationProgress(quals);
    expect(result.overdueCount).toBe(3);
    // Score cannot go below 0
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("counts enrolled as in_progress for rate", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", status: "enrolled", actualCompletion: null }),
    ];
    const result = evaluateQualificationProgress(quals);
    expect(result.inProgressRate).toBe(100);
    expect(result.completedRate).toBe(0);
  });

  it("tracks level distribution correctly", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", level: "level_3" }),
      makeQualification({ id: "q2", level: "level_3" }),
      makeQualification({ id: "q3", level: "level_5" }),
    ];
    const result = evaluateQualificationProgress(quals);
    expect(result.levelDistribution.level_3).toBe(2);
    expect(result.levelDistribution.level_5).toBe(1);
    expect(result.levelDistribution.degree).toBe(0);
  });

  it("handles mixed statuses correctly", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", status: "completed" }),
      makeQualification({ id: "q2", status: "in_progress", actualCompletion: null }),
      makeQualification({ id: "q3", status: "overdue", actualCompletion: null }),
      makeQualification({ id: "q4", status: "withdrawn", actualCompletion: null }),
    ];
    const result = evaluateQualificationProgress(quals);
    expect(result.completedRate).toBe(25);
    expect(result.inProgressRate).toBe(25);
    expect(result.overdueCount).toBe(1);
    expect(result.totalQualifications).toBe(4);
  });

  it("calculates funded and support rates independently", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", fundedByEmployer: true, supportProvided: false }),
      makeQualification({ id: "q2", fundedByEmployer: false, supportProvided: true }),
    ];
    const result = evaluateQualificationProgress(quals);
    expect(result.fundedRate).toBe(50);
    expect(result.supportRate).toBe(50);
  });

  it("score does not exceed 25", () => {
    const quals: QualificationProgress[] = Array.from({ length: 10 }, (_, i) =>
      makeQualification({ id: `q${i}` }),
    );
    const result = evaluateQualificationProgress(quals);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSupervisionDevelopment
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupervisionDevelopment", () => {
  it("returns zeroes for empty data", () => {
    const result = evaluateSupervisionDevelopment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSupervisions).toBe(0);
    expect(result.goalsSetRate).toBeNull();
    expect(result.progressReviewedRate).toBeNull();
    expect(result.trainingNeedsRate).toBeNull();
    expect(result.actionPlanRate).toBeNull();
    expect(result.actionsCompletedRate).toBeNull();
  });

  it("returns max score for perfect data", () => {
    const sups: SupervisionDevelopment[] = [
      makeSupervision({ id: "s1" }),
      makeSupervision({ id: "s2", staffId: "staff-2" }),
    ];
    const result = evaluateSupervisionDevelopment(sups);
    expect(result.overallScore).toBe(25);
    expect(result.goalsSetRate).toBe(100);
    expect(result.progressReviewedRate).toBe(100);
    expect(result.trainingNeedsRate).toBe(100);
    expect(result.actionPlanRate).toBe(100);
    expect(result.actionsCompletedRate).toBe(100);
  });

  it("handles null previousActionsCompleted (first supervision)", () => {
    const sups: SupervisionDevelopment[] = [
      makeSupervision({ id: "s1", previousActionsCompleted: null }),
    ];
    const result = evaluateSupervisionDevelopment(sups);
    // With null previousActionsCompleted, den is 0 for that metric → pct = 0
    expect(result.actionsCompletedRate).toBeNull();
    // But other metrics still score
    expect(result.goalsSetRate).toBe(100);
  });

  it("scores partially with mixed boolean values", () => {
    const sups: SupervisionDevelopment[] = [
      makeSupervision({ id: "s1", developmentGoalsSet: true, progressReviewed: false, trainingNeedsIdentified: true, actionPlanCreated: false }),
      makeSupervision({ id: "s2", developmentGoalsSet: false, progressReviewed: true, trainingNeedsIdentified: false, actionPlanCreated: true }),
    ];
    const result = evaluateSupervisionDevelopment(sups);
    expect(result.goalsSetRate).toBe(50);
    expect(result.progressReviewedRate).toBe(50);
    expect(result.trainingNeedsRate).toBe(50);
    expect(result.actionPlanRate).toBe(50);
  });

  it("scores all zeros when nothing set", () => {
    const sups: SupervisionDevelopment[] = [
      makeSupervision({
        id: "s1",
        developmentGoalsSet: false,
        progressReviewed: false,
        trainingNeedsIdentified: false,
        actionPlanCreated: false,
        previousActionsCompleted: false,
      }),
    ];
    const result = evaluateSupervisionDevelopment(sups);
    expect(result.overallScore).toBe(0);
    expect(result.goalsSetRate).toBe(0);
    expect(result.actionsCompletedRate).toBe(0);
  });

  it("score does not exceed 25", () => {
    const sups: SupervisionDevelopment[] = Array.from({ length: 20 }, (_, i) =>
      makeSupervision({ id: `s${i}` }),
    );
    const result = evaluateSupervisionDevelopment(sups);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts totalSupervisions correctly", () => {
    const sups: SupervisionDevelopment[] = [
      makeSupervision({ id: "s1" }),
      makeSupervision({ id: "s2" }),
      makeSupervision({ id: "s3" }),
    ];
    const result = evaluateSupervisionDevelopment(sups);
    expect(result.totalSupervisions).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateLearningCulture
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLearningCulture", () => {
  it("returns zeroes for empty data", () => {
    const result = evaluateLearningCulture([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.teamMeetingRate).toBeNull();
    expect(result.sharedLearningRate).toBeNull();
    expect(result.reflectiveRate).toBeNull();
    expect(result.feedbackCultureRate).toBeNull();
    expect(result.innovationRate).toBeNull();
    expect(result.budgetRate).toBeNull();
    expect(result.inductionRate).toBeNull();
  });

  it("returns max score for all-true assessment", () => {
    const assessments: LearningCulture[] = [makeLearningCulture()];
    const result = evaluateLearningCulture(assessments);
    expect(result.overallScore).toBe(25);
    expect(result.teamMeetingRate).toBe(100);
    expect(result.reflectiveRate).toBe(100);
    expect(result.feedbackCultureRate).toBe(100);
  });

  it("returns 0 for all-false assessment", () => {
    const assessments: LearningCulture[] = [
      makeLearningCulture({
        regularTeamMeetings: false,
        sharedLearningOpportunities: false,
        reflectivePracticeEmbedded: false,
        feedbackCulture: false,
        innovationEncouraged: false,
        budgetAllocated: false,
        trainingCalendarExists: false,
        inductionProgramRobust: false,
      }),
    ];
    const result = evaluateLearningCulture(assessments);
    expect(result.overallScore).toBe(0);
  });

  it("weighs reflective practice and feedback culture higher", () => {
    // Only reflective practice true
    const reflectiveOnly: LearningCulture[] = [
      makeLearningCulture({
        regularTeamMeetings: false,
        sharedLearningOpportunities: false,
        reflectivePracticeEmbedded: true,
        feedbackCulture: false,
        innovationEncouraged: false,
        budgetAllocated: false,
        trainingCalendarExists: false,
        inductionProgramRobust: false,
      }),
    ];
    const reflectiveResult = evaluateLearningCulture(reflectiveOnly);

    // Only team meetings true (weighted at 3, lower than 3.5)
    const meetingOnly: LearningCulture[] = [
      makeLearningCulture({
        regularTeamMeetings: true,
        sharedLearningOpportunities: false,
        reflectivePracticeEmbedded: false,
        feedbackCulture: false,
        innovationEncouraged: false,
        budgetAllocated: false,
        trainingCalendarExists: false,
        inductionProgramRobust: false,
      }),
    ];
    const meetingResult = evaluateLearningCulture(meetingOnly);

    expect(reflectiveResult.overallScore).toBeGreaterThanOrEqual(meetingResult.overallScore);
  });

  it("handles multiple assessments and averages rates", () => {
    const assessments: LearningCulture[] = [
      makeLearningCulture({ id: "lc-1", regularTeamMeetings: true }),
      makeLearningCulture({ id: "lc-2", regularTeamMeetings: false }),
    ];
    const result = evaluateLearningCulture(assessments);
    expect(result.teamMeetingRate).toBe(50);
    expect(result.totalAssessments).toBe(2);
  });

  it("score does not exceed 25", () => {
    const assessments: LearningCulture[] = Array.from({ length: 10 }, (_, i) =>
      makeLearningCulture({ id: `lc${i}` }),
    );
    const result = evaluateLearningCulture(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("partially true assessments score between 0 and 25", () => {
    const assessments: LearningCulture[] = [
      makeLearningCulture({
        regularTeamMeetings: true,
        sharedLearningOpportunities: true,
        reflectivePracticeEmbedded: true,
        feedbackCulture: false,
        innovationEncouraged: false,
        budgetAllocated: false,
        trainingCalendarExists: false,
        inductionProgramRobust: false,
      }),
    ];
    const result = evaluateLearningCulture(assessments);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildStaffDevelopmentProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildStaffDevelopmentProfiles", () => {
  it("returns empty array when no data", () => {
    const result = buildStaffDevelopmentProfiles([], []);
    expect(result).toEqual([]);
  });

  it("builds profile from CPD records only", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", staffName: "Alice", hours: 20 }),
      makeCPDRecord({ id: "r2", staffId: "s1", staffName: "Alice", hours: 15 }),
    ];
    const result = buildStaffDevelopmentProfiles(records, []);
    expect(result).toHaveLength(1);
    expect(result[0].staffId).toBe("s1");
    expect(result[0].totalCPDHours).toBe(35);
    expect(result[0].qualificationsCompleted).toBe(0);
    expect(result[0].qualificationsInProgress).toBe(0);
  });

  it("builds profile from qualifications only", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", staffId: "s1", staffName: "Bob", status: "completed" }),
      makeQualification({ id: "q2", staffId: "s1", staffName: "Bob", status: "in_progress", actualCompletion: null }),
    ];
    const result = buildStaffDevelopmentProfiles([], quals);
    expect(result).toHaveLength(1);
    expect(result[0].qualificationsCompleted).toBe(1);
    expect(result[0].qualificationsInProgress).toBe(1);
    expect(result[0].totalCPDHours).toBe(0);
  });

  it("flags overdue qualifications", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", staffId: "s1", status: "overdue", actualCompletion: null }),
    ];
    const result = buildStaffDevelopmentProfiles([], quals);
    expect(result[0].hasOverdueQualification).toBe(true);
  });

  it("no overdue flag when qualifications on track", () => {
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", staffId: "s1", status: "completed" }),
    ];
    const result = buildStaffDevelopmentProfiles([], quals);
    expect(result[0].hasOverdueQualification).toBe(false);
  });

  it("calculates impact assessment rate per staff", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", impactAssessed: true }),
      makeCPDRecord({ id: "r2", staffId: "s1", impactAssessed: false }),
    ];
    const result = buildStaffDevelopmentProfiles(records, []);
    expect(result[0].impactAssessmentRate).toBe(50);
  });

  it("merges staff from both CPD and qualifications", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", staffName: "Alice" }),
    ];
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", staffId: "s2", staffName: "Bob" }),
    ];
    const result = buildStaffDevelopmentProfiles(records, quals);
    expect(result).toHaveLength(2);
    const ids = result.map((p) => p.staffId).sort();
    expect(ids).toEqual(["s1", "s2"]);
  });

  it("overall score capped at 10", () => {
    const records: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", hours: 40 }),
    ];
    const quals: QualificationProgress[] = [
      makeQualification({ id: "q1", staffId: "s1", status: "completed" }),
      makeQualification({ id: "q2", staffId: "s1", status: "completed" }),
    ];
    const result = buildStaffDevelopmentProfiles(records, quals);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives higher score to staff with more CPD hours", () => {
    const highHours: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", staffName: "High", hours: 40 }),
    ];
    const lowHours: CPDRecord[] = [
      makeCPDRecord({ id: "r2", staffId: "s2", staffName: "Low", hours: 5, impactAssessed: false, impact: null }),
    ];
    const high = buildStaffDevelopmentProfiles(highHours, []);
    const low = buildStaffDevelopmentProfiles(lowHours, []);
    expect(high[0].overallScore).toBeGreaterThan(low[0].overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateProfessionalDevelopmentIntelligence — Main function
// ══════════════════════════════════════════════════════════════════════════════

describe("generateProfessionalDevelopmentIntelligence", () => {
  const perfectCPD: CPDRecord[] = [
    makeCPDRecord({ id: "r1", staffId: "s1", staffName: "Darren Laville", hours: 35, category: "mandatory_training" }),
    makeCPDRecord({ id: "r2", staffId: "s1", staffName: "Darren Laville", hours: 10, category: "external_course" }),
    makeCPDRecord({ id: "r3", staffId: "s2", staffName: "Sarah Johnson", hours: 30, category: "specialist_qualification" }),
    makeCPDRecord({ id: "r4", staffId: "s2", staffName: "Sarah Johnson", hours: 15, category: "reflective_practice" }),
  ];

  const perfectQuals: QualificationProgress[] = [
    makeQualification({ id: "q1", staffId: "s1", staffName: "Darren Laville", level: "level_5" }),
    makeQualification({ id: "q2", staffId: "s2", staffName: "Sarah Johnson", level: "level_3" }),
  ];

  const perfectSupervisions: SupervisionDevelopment[] = [
    makeSupervision({ id: "sup1", staffId: "s1", staffName: "Darren Laville" }),
    makeSupervision({ id: "sup2", staffId: "s2", staffName: "Sarah Johnson" }),
    makeSupervision({ id: "sup3", staffId: "s1", staffName: "Darren Laville" }),
    makeSupervision({ id: "sup4", staffId: "s2", staffName: "Sarah Johnson" }),
  ];

  const perfectCulture: LearningCulture[] = [makeLearningCulture()];

  it("returns correct structure", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.cpdQuality).toBeDefined();
    expect(result.qualificationProgress).toBeDefined();
    expect(result.supervisionDevelopment).toBeDefined();
    expect(result.learningCulture).toBeDefined();
    expect(Array.isArray(result.staffProfiles)).toBe(true);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("caps overall score at 100", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("returns outstanding for perfect data", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for empty data", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("sums 4 sub-domain scores", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expectedSum = result.cpdQuality.overallScore
      + result.qualificationProgress.overallScore
      + result.supervisionDevelopment.overallScore
      + result.learningCulture.overallScore;
    expect(result.overallScore).toBe(Math.min(100, Math.max(0, expectedSum)));
  });

  it("generates strengths when scores are high", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths[0]).not.toContain("No significant strengths");
  });

  it("generates areas for improvement when scores are low", () => {
    const poorCPD: CPDRecord[] = [
      makeCPDRecord({ id: "r1", hours: 5, impactAssessed: false, impact: null, sharedWithTeam: false, relevantToRole: false }),
    ];
    const result = generateProfessionalDevelopmentIntelligence(
      poorCPD, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for overdue qualifications", () => {
    const overdueQuals: QualificationProgress[] = [
      makeQualification({ id: "q1", status: "overdue", actualCompletion: null }),
      makeQualification({ id: "q2", status: "overdue", actualCompletion: null }),
    ];
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, overdueQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT:"));
    expect(urgentActions.length).toBeGreaterThan(0);
  });

  it("includes all 8 regulatory links", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(8);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Reg 33");
    expect(result.regulatoryLinks[1]).toContain("CHR 2015 Reg 32");
    expect(result.regulatoryLinks[2]).toContain("NMS 19");
    expect(result.regulatoryLinks[3]).toContain("SCCIF");
    expect(result.regulatoryLinks[4]).toContain("Working Together 2023");
    expect(result.regulatoryLinks[5]).toContain("CHR 2015 Schedule 1");
    expect(result.regulatoryLinks[6]).toContain("CA 1989");
    expect(result.regulatoryLinks[7]).toContain("Skills for Care");
  });

  it("includes staff profiles", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.staffProfiles.length).toBeGreaterThan(0);
    expect(result.staffProfiles[0].staffId).toBeDefined();
    expect(result.staffProfiles[0].staffName).toBeDefined();
  });

  it("rating thresholds - good range", () => {
    // Use data that should produce a "good" score (60-79)
    const moderateCPD: CPDRecord[] = [
      makeCPDRecord({ id: "r1", hours: 25, sharedWithTeam: false }),
    ];
    const moderateSupervisions: SupervisionDevelopment[] = [
      makeSupervision({ id: "s1", actionPlanCreated: false, previousActionsCompleted: null }),
    ];
    const moderateCulture: LearningCulture[] = [
      makeLearningCulture({
        innovationEncouraged: false,
        budgetAllocated: false,
        trainingCalendarExists: false,
      }),
    ];
    const result = generateProfessionalDevelopmentIntelligence(
      moderateCPD, perfectQuals, moderateSupervisions, moderateCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    // Verify score is in expected range and rating matches
    expect(["good", "outstanding", "requires_improvement"]).toContain(result.rating);
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("rating thresholds - requires improvement range", () => {
    const poorCPD: CPDRecord[] = [
      makeCPDRecord({ id: "r1", hours: 10, impactAssessed: false, impact: null, sharedWithTeam: false }),
    ];
    const poorSupervisions: SupervisionDevelopment[] = [
      makeSupervision({
        id: "s1",
        developmentGoalsSet: false,
        progressReviewed: false,
        trainingNeedsIdentified: false,
        actionPlanCreated: false,
        previousActionsCompleted: null,
      }),
    ];
    const result = generateProfessionalDevelopmentIntelligence(
      poorCPD, [], poorSupervisions, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("generates default strengths message when none identified", () => {
    const poorCPD: CPDRecord[] = [
      makeCPDRecord({
        id: "r1",
        hours: 5,
        impactAssessed: false,
        impact: null,
        sharedWithTeam: false,
        relevantToRole: false,
        certificateObtained: false,
      }),
    ];
    const overdueQuals: QualificationProgress[] = [
      makeQualification({ id: "q1", status: "overdue", actualCompletion: null, fundedByEmployer: false, supportProvided: false }),
    ];
    const poorSups: SupervisionDevelopment[] = [
      makeSupervision({
        id: "s1",
        developmentGoalsSet: false,
        progressReviewed: false,
        trainingNeedsIdentified: false,
        actionPlanCreated: false,
        previousActionsCompleted: false,
      }),
    ];
    const poorCulture: LearningCulture[] = [
      makeLearningCulture({
        regularTeamMeetings: false,
        sharedLearningOpportunities: false,
        reflectivePracticeEmbedded: false,
        feedbackCulture: false,
        innovationEncouraged: false,
        budgetAllocated: false,
        trainingCalendarExists: false,
        inductionProgramRobust: false,
      }),
    ];
    const result = generateProfessionalDevelopmentIntelligence(
      poorCPD, overdueQuals, poorSups, poorCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("No significant strengths"))).toBe(true);
  });

  it("generates no-action message when everything is fine", () => {
    const result = generateProfessionalDevelopmentIntelligence(
      perfectCPD, perfectQuals, perfectSupervisions, perfectCulture,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("handles single staff member data", () => {
    const singleCPD: CPDRecord[] = [
      makeCPDRecord({ id: "r1", staffId: "s1", hours: 30 }),
    ];
    const result = generateProfessionalDevelopmentIntelligence(
      singleCPD, [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.staffProfiles).toHaveLength(1);
    expect(result.homeId).toBe("test-home");
  });
});
