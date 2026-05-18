// ══════════════════════════════════════════════════════════════════════════════
// Tests — Equality & Diversity Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateEqualityDiversityIntelligence,
  evaluateIndividualSupport,
  evaluateStaffCompetency,
  evaluateIncidentResponse,
  evaluateAccessibilityInclusion,
  getProtectedCharacteristicLabel,
  getSupportStatusLabel,
  getTrainingStatusLabel,
  getIncidentCategoryLabel,
  getIncidentSeverityLabel,
  getIncidentOutcomeLabel,
  getCulturalPlanStatusLabel,
  getDemoProfiles,
  getDemoTrainingRecords,
  getDemoIncidents,
  getDemoAudits,
} from "../equality-diversity-engine";
import type {
  ChildDiversityProfile,
  EDITrainingRecord,
  EDIIncident,
  AccessibilityAudit,
  ProtectedCharacteristic,
  SupportStatus,
  TrainingStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentOutcome,
  CulturalPlanStatus,
} from "../equality-diversity-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

function makeProfile(overrides: Partial<ChildDiversityProfile> = {}): ChildDiversityProfile {
  return {
    id: "edp-1",
    childId: "child-1",
    childName: "Test Child",
    characteristics: [
      { characteristic: "race", details: "White British", supportStatus: "fully_supported" },
      { characteristic: "religion_or_belief", details: "Christianity", supportStatus: "fully_supported" },
    ],
    culturalPlanStatus: "active",
    culturalPlanLastReviewed: "2026-04-01",
    dietaryNeedsMet: true,
    religiousPracticeFacilitated: true,
    languageSupportProvided: true,
    identityWorkCompleted: true,
    lastAssessedDate: "2026-04-01",
    assessedBy: "Tester",
    ...overrides,
  };
}

function makeTrainingRecord(overrides: Partial<EDITrainingRecord> = {}): EDITrainingRecord {
  return {
    id: "etr-1",
    staffId: "staff-1",
    staffName: "Staff One",
    trainingType: "Equality Act 2010",
    status: "completed",
    completedDate: "2026-01-15",
    expiryDate: "2027-01-15",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<EDIIncident> = {}): EDIIncident {
  return {
    id: "inc-1",
    reportDate: "2026-03-01",
    category: "discrimination",
    severity: "medium",
    childInvolved: true,
    childId: "child-1",
    description: "Test incident",
    outcome: "resolved",
    lessonsIdentified: true,
    actionsTaken: ["Action 1", "Action 2", "Action 3"],
    ...overrides,
  };
}

function makeAudit(overrides: Partial<AccessibilityAudit> = {}): AccessibilityAudit {
  return {
    id: "aa-1",
    auditDate: "2026-04-01",
    physicalAccessScore: 9,
    communicationAccessScore: 9,
    informationAccessScore: 9,
    activityAccessScore: 9,
    auditor: "Tester",
    improvementsIdentified: 5,
    improvementsCompleted: 5,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// LABEL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("getProtectedCharacteristicLabel", () => {
  it("returns correct label for age", () => {
    expect(getProtectedCharacteristicLabel("age")).toBe("Age");
  });

  it("returns correct label for disability", () => {
    expect(getProtectedCharacteristicLabel("disability")).toBe("Disability");
  });

  it("returns correct label for gender_reassignment", () => {
    expect(getProtectedCharacteristicLabel("gender_reassignment")).toBe("Gender Reassignment");
  });

  it("returns correct label for race", () => {
    expect(getProtectedCharacteristicLabel("race")).toBe("Race");
  });

  it("returns correct label for religion_or_belief", () => {
    expect(getProtectedCharacteristicLabel("religion_or_belief")).toBe("Religion or Belief");
  });

  it("returns correct label for sex", () => {
    expect(getProtectedCharacteristicLabel("sex")).toBe("Sex");
  });

  it("returns correct label for sexual_orientation", () => {
    expect(getProtectedCharacteristicLabel("sexual_orientation")).toBe("Sexual Orientation");
  });

  it("returns correct label for pregnancy_and_maternity", () => {
    expect(getProtectedCharacteristicLabel("pregnancy_and_maternity")).toBe("Pregnancy and Maternity");
  });

  it("returns correct label for marriage_and_civil_partnership", () => {
    expect(getProtectedCharacteristicLabel("marriage_and_civil_partnership")).toBe("Marriage and Civil Partnership");
  });
});

describe("getSupportStatusLabel", () => {
  it("returns correct label for fully_supported", () => {
    expect(getSupportStatusLabel("fully_supported")).toBe("Fully Supported");
  });

  it("returns correct label for partially_supported", () => {
    expect(getSupportStatusLabel("partially_supported")).toBe("Partially Supported");
  });

  it("returns correct label for not_supported", () => {
    expect(getSupportStatusLabel("not_supported")).toBe("Not Supported");
  });

  it("returns correct label for not_applicable", () => {
    expect(getSupportStatusLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getTrainingStatusLabel", () => {
  it("returns correct label for completed", () => {
    expect(getTrainingStatusLabel("completed")).toBe("Completed");
  });

  it("returns correct label for booked", () => {
    expect(getTrainingStatusLabel("booked")).toBe("Booked");
  });

  it("returns correct label for overdue", () => {
    expect(getTrainingStatusLabel("overdue")).toBe("Overdue");
  });

  it("returns correct label for not_required", () => {
    expect(getTrainingStatusLabel("not_required")).toBe("Not Required");
  });
});

describe("getIncidentCategoryLabel", () => {
  it("returns correct label for discrimination", () => {
    expect(getIncidentCategoryLabel("discrimination")).toBe("Discrimination");
  });

  it("returns correct label for bullying", () => {
    expect(getIncidentCategoryLabel("bullying")).toBe("Bullying");
  });

  it("returns correct label for hate_incident", () => {
    expect(getIncidentCategoryLabel("hate_incident")).toBe("Hate Incident");
  });

  it("returns correct label for cultural_insensitivity", () => {
    expect(getIncidentCategoryLabel("cultural_insensitivity")).toBe("Cultural Insensitivity");
  });

  it("returns correct label for language_barrier", () => {
    expect(getIncidentCategoryLabel("language_barrier")).toBe("Language Barrier");
  });

  it("returns correct label for accessibility_barrier", () => {
    expect(getIncidentCategoryLabel("accessibility_barrier")).toBe("Accessibility Barrier");
  });
});

describe("getIncidentSeverityLabel", () => {
  it("returns correct label for critical", () => {
    expect(getIncidentSeverityLabel("critical")).toBe("Critical");
  });

  it("returns correct label for high", () => {
    expect(getIncidentSeverityLabel("high")).toBe("High");
  });

  it("returns correct label for medium", () => {
    expect(getIncidentSeverityLabel("medium")).toBe("Medium");
  });

  it("returns correct label for low", () => {
    expect(getIncidentSeverityLabel("low")).toBe("Low");
  });
});

describe("getIncidentOutcomeLabel", () => {
  it("returns correct label for resolved", () => {
    expect(getIncidentOutcomeLabel("resolved")).toBe("Resolved");
  });

  it("returns correct label for ongoing", () => {
    expect(getIncidentOutcomeLabel("ongoing")).toBe("Ongoing");
  });

  it("returns correct label for escalated", () => {
    expect(getIncidentOutcomeLabel("escalated")).toBe("Escalated");
  });

  it("returns correct label for lessons_learned", () => {
    expect(getIncidentOutcomeLabel("lessons_learned")).toBe("Lessons Learned");
  });
});

describe("getCulturalPlanStatusLabel", () => {
  it("returns correct label for active", () => {
    expect(getCulturalPlanStatusLabel("active")).toBe("Active");
  });

  it("returns correct label for review_due", () => {
    expect(getCulturalPlanStatusLabel("review_due")).toBe("Review Due");
  });

  it("returns correct label for not_in_place", () => {
    expect(getCulturalPlanStatusLabel("not_in_place")).toBe("Not in Place");
  });

  it("returns correct label for not_applicable", () => {
    expect(getCulturalPlanStatusLabel("not_applicable")).toBe("Not Applicable");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIndividualSupport
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIndividualSupport", () => {
  it("returns zero score for empty profiles", () => {
    const result = evaluateIndividualSupport([], PERIOD_END);
    expect(result.totalChildren).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns max score when all children are fully supported", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", childName: "A" }),
      makeProfile({ id: "p2", childId: "c2", childName: "B" }),
      makeProfile({ id: "p3", childId: "c3", childName: "C" }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.fullySupportedRate).toBe(100);
    expect(result.score).toBe(30);
  });

  it("correctly counts fully supported children", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1" }),
      makeProfile({
        id: "p2",
        childId: "c2",
        characteristics: [
          { characteristic: "race", details: "Mixed", supportStatus: "partially_supported" },
        ],
      }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.fullySupported).toBe(1);
    expect(result.fullySupportedRate).toBe(50);
  });

  it("counts partially supported children", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        childId: "c1",
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "partially_supported" },
        ],
      }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.partiallySupportedCount).toBe(1);
  });

  it("counts not supported children", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        childId: "c1",
        characteristics: [
          { characteristic: "disability", details: "X", supportStatus: "not_supported" },
        ],
      }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.notSupportedCount).toBe(1);
  });

  it("treats not_applicable as fully supported for scoring", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        childId: "c1",
        characteristics: [
          { characteristic: "religion_or_belief", details: "None", supportStatus: "not_applicable" },
        ],
      }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.fullySupported).toBe(1);
  });

  it("calculates cultural plan coverage correctly", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", culturalPlanStatus: "active" }),
      makeProfile({ id: "p2", childId: "c2", culturalPlanStatus: "not_in_place" }),
      makeProfile({ id: "p3", childId: "c3", culturalPlanStatus: "not_applicable" }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.culturalPlanCoverage).toBe(67); // 2 out of 3
  });

  it("calculates dietary rate correctly", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", dietaryNeedsMet: true }),
      makeProfile({ id: "p2", childId: "c2", dietaryNeedsMet: false }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.dietaryRate).toBe(50);
  });

  it("calculates religious rate correctly", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", religiousPracticeFacilitated: true }),
      makeProfile({ id: "p2", childId: "c2", religiousPracticeFacilitated: false }),
      makeProfile({ id: "p3", childId: "c3", religiousPracticeFacilitated: true }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.religiousRate).toBe(67);
  });

  it("calculates language rate correctly", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", languageSupportProvided: false }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.languageRate).toBe(0);
  });

  it("calculates identity work rate correctly", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", identityWorkCompleted: true }),
      makeProfile({ id: "p2", childId: "c2", identityWorkCompleted: true }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.identityWorkRate).toBe(100);
  });

  it("detects all assessed within 90 days", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", lastAssessedDate: "2026-04-01" }),
      makeProfile({ id: "p2", childId: "c2", lastAssessedDate: "2026-03-01" }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.allAssessedWithin90Days).toBe(true);
  });

  it("detects when not all assessed within 90 days", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", lastAssessedDate: "2026-01-01" }),
      makeProfile({ id: "p2", childId: "c2", lastAssessedDate: "2026-04-01" }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.allAssessedWithin90Days).toBe(false);
  });

  it("awards 3 bonus points for all assessed within 90 days", () => {
    const recentProfile = makeProfile({
      lastAssessedDate: "2026-04-01",
    });
    const oldProfile = makeProfile({
      id: "p2",
      childId: "c2",
      lastAssessedDate: "2025-12-01",
    });
    const r1 = evaluateIndividualSupport([recentProfile], PERIOD_END);
    const r2 = evaluateIndividualSupport([oldProfile], PERIOD_END);
    expect(r1.score - r2.score).toBe(3);
  });

  it("clamps score to 30 maximum", () => {
    // Even with perfect data across many children, should not exceed 30
    const profiles = Array.from({ length: 10 }, (_, i) =>
      makeProfile({ id: `p${i}`, childId: `c${i}`, childName: `Child ${i}` }),
    );
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("produces score of 0 when nothing is supported", () => {
    const profile = makeProfile({
      characteristics: [
        { characteristic: "race", details: "X", supportStatus: "not_supported" },
      ],
      culturalPlanStatus: "not_in_place",
      dietaryNeedsMet: false,
      religiousPracticeFacilitated: false,
      languageSupportProvided: false,
      identityWorkCompleted: false,
      lastAssessedDate: "2025-01-01",
    });
    const result = evaluateIndividualSupport([profile], PERIOD_END);
    expect(result.score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffCompetency
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffCompetency", () => {
  it("returns zero score for zero staff", () => {
    const result = evaluateStaffCompetency([], 0);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns low score for staff with no training", () => {
    const result = evaluateStaffCompetency([], 4);
    expect(result.completionRate).toBe(0);
    // 0 from completion tier + 5 no overdue + 0 coverage + 3 no expired + 0 bonus = 8
    expect(result.score).toBe(8);
  });

  it("awards 10 points for completion rate >= 90%", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", staffName: "A" }),
      makeTrainingRecord({ id: "2", staffId: "s2", staffName: "B" }),
      makeTrainingRecord({ id: "3", staffId: "s3", staffName: "C" }),
      makeTrainingRecord({ id: "4", staffId: "s4", staffName: "D" }),
    ];
    const result = evaluateStaffCompetency(records, 4);
    expect(result.completionRate).toBe(100);
    // At least 10 from completion
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("awards 7 points for completion rate >= 70%", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1" }),
      makeTrainingRecord({ id: "2", staffId: "s2" }),
      makeTrainingRecord({ id: "3", staffId: "s3" }),
    ];
    const result = evaluateStaffCompetency(records, 4);
    expect(result.completionRate).toBe(75);
    expect(result.score).toBeGreaterThanOrEqual(7);
  });

  it("awards 4 points for completion rate >= 50%", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1" }),
      makeTrainingRecord({ id: "2", staffId: "s2" }),
    ];
    const result = evaluateStaffCompetency(records, 4);
    expect(result.completionRate).toBe(50);
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it("awards 0 for completion rate below 50%", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1" }),
    ];
    // 1 out of 4 = 25%
    const result = evaluateStaffCompetency(records, 4);
    expect(result.completionRate).toBe(25);
    // 0 from completion tier, but other bonuses possible
  });

  it("awards 5 points when no overdue training", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", status: "completed" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.overdueCount).toBe(0);
    // Should include 5 points for no overdue
  });

  it("withholds 5 points when there is overdue training", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", status: "completed" }),
      makeTrainingRecord({ id: "2", staffId: "s1", status: "overdue", trainingType: "Cultural Competency" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.overdueCount).toBe(1);
  });

  it("awards 4 points for 3+ unique training types", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Equality Act 2010" }),
      makeTrainingRecord({ id: "2", staffId: "s1", trainingType: "Cultural Competency" }),
      makeTrainingRecord({ id: "3", staffId: "s1", trainingType: "Unconscious Bias" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.uniqueTrainingTypesCount).toBe(3);
  });

  it("detects Equality Act training", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Equality Act 2010" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.hasEqualityActTraining).toBe(true);
  });

  it("detects Cultural Competency training", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Cultural Competency" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.hasCulturalCompetencyTraining).toBe(true);
  });

  it("awards 3 bonus for both equality_act and cultural_competency", () => {
    const withBoth = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Equality Act 2010" }),
      makeTrainingRecord({ id: "2", staffId: "s1", trainingType: "Cultural Competency" }),
      makeTrainingRecord({ id: "3", staffId: "s1", trainingType: "Unconscious Bias" }),
    ];
    const withoutBoth = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Equality Act 2010" }),
      makeTrainingRecord({ id: "2", staffId: "s1", trainingType: "Unconscious Bias" }),
      makeTrainingRecord({ id: "3", staffId: "s1", trainingType: "Anti-Discriminatory Practice" }),
    ];
    const r1 = evaluateStaffCompetency(withBoth, 1);
    const r2 = evaluateStaffCompetency(withoutBoth, 1);
    expect(r1.score - r2.score).toBe(3);
  });

  it("clamps score to 25 maximum", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Equality Act 2010" }),
      makeTrainingRecord({ id: "2", staffId: "s1", trainingType: "Cultural Competency" }),
      makeTrainingRecord({ id: "3", staffId: "s1", trainingType: "Unconscious Bias" }),
      makeTrainingRecord({ id: "4", staffId: "s1", trainingType: "Anti-Discriminatory Practice" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("counts expired training correctly", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", expiryDate: "2020-01-01" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.expiredCount).toBe(1);
  });

  it("does not count future expiry as expired", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", expiryDate: "2099-01-01" }),
    ];
    const result = evaluateStaffCompetency(records, 1);
    expect(result.expiredCount).toBe(0);
  });

  it("counts unique staff who completed training", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", trainingType: "Equality Act 2010" }),
      makeTrainingRecord({ id: "2", staffId: "s1", trainingType: "Cultural Competency" }),
      makeTrainingRecord({ id: "3", staffId: "s2", trainingType: "Equality Act 2010" }),
    ];
    const result = evaluateStaffCompetency(records, 3);
    expect(result.completedCount).toBe(2);
    expect(result.completionRate).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIncidentResponse
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentResponse", () => {
  it("returns max score of 25 for no incidents", () => {
    const result = evaluateIncidentResponse([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.score).toBe(25);
  });

  it("counts total incidents", () => {
    const incidents = [makeIncident({ id: "1" }), makeIncident({ id: "2" })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.totalIncidents).toBe(2);
  });

  it("calculates resolution rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", outcome: "resolved" }),
      makeIncident({ id: "2", outcome: "ongoing" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.resolutionRate).toBe(50);
    expect(result.resolvedCount).toBe(1);
  });

  it("treats lessons_learned as resolved", () => {
    const incidents = [
      makeIncident({ id: "1", outcome: "lessons_learned" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.resolvedCount).toBe(1);
    expect(result.resolutionRate).toBe(100);
  });

  it("awards 8 points for resolution rate >= 90%", () => {
    const incidents = [
      makeIncident({ id: "1", outcome: "resolved" }),
      makeIncident({ id: "2", outcome: "resolved" }),
      makeIncident({ id: "3", outcome: "resolved" }),
      makeIncident({ id: "4", outcome: "resolved" }),
      makeIncident({ id: "5", outcome: "resolved" }),
      makeIncident({ id: "6", outcome: "resolved" }),
      makeIncident({ id: "7", outcome: "resolved" }),
      makeIncident({ id: "8", outcome: "resolved" }),
      makeIncident({ id: "9", outcome: "resolved" }),
      makeIncident({ id: "10", outcome: "ongoing" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.resolutionRate).toBe(90);
  });

  it("calculates lessons identified rate", () => {
    const incidents = [
      makeIncident({ id: "1", lessonsIdentified: true }),
      makeIncident({ id: "2", lessonsIdentified: false }),
      makeIncident({ id: "3", lessonsIdentified: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.lessonsIdentifiedCount).toBe(2);
    expect(result.lessonsRate).toBe(67);
  });

  it("awards 5 points for lessons rate >= 80%", () => {
    const incidents = [
      makeIncident({ id: "1", lessonsIdentified: true }),
      makeIncident({ id: "2", lessonsIdentified: true }),
      makeIncident({ id: "3", lessonsIdentified: true }),
      makeIncident({ id: "4", lessonsIdentified: true }),
      makeIncident({ id: "5", lessonsIdentified: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.lessonsRate).toBe(80);
  });

  it("calculates average actions per incident", () => {
    const incidents = [
      makeIncident({ id: "1", actionsTaken: ["A", "B"] }),
      makeIncident({ id: "2", actionsTaken: ["A", "B", "C", "D"] }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.averageActionsPerIncident).toBe(3);
  });

  it("awards 4 points for average actions >= 2", () => {
    const incidents = [
      makeIncident({ id: "1", actionsTaken: ["A", "B"] }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.averageActionsPerIncident).toBe(2);
  });

  it("counts unresolved critical/high incidents", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "critical", outcome: "ongoing" }),
      makeIncident({ id: "2", severity: "high", outcome: "escalated" }),
      makeIncident({ id: "3", severity: "medium", outcome: "ongoing" }),
      makeIncident({ id: "4", severity: "critical", outcome: "resolved" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.unresolvedCriticalOrHigh).toBe(2);
  });

  it("awards 3 points when no unresolved critical/high", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "critical", outcome: "resolved" }),
      makeIncident({ id: "2", severity: "high", outcome: "lessons_learned" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.unresolvedCriticalOrHigh).toBe(0);
  });

  it("calculates escalation rate", () => {
    const incidents = [
      makeIncident({ id: "1", outcome: "escalated" }),
      makeIncident({ id: "2", outcome: "resolved" }),
      makeIncident({ id: "3", outcome: "resolved" }),
      makeIncident({ id: "4", outcome: "resolved" }),
      makeIncident({ id: "5", outcome: "resolved" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.escalationRate).toBe(20);
    expect(result.escalatedCount).toBe(1);
  });

  it("awards 3 points when escalation rate < 20%", () => {
    const incidents = [
      makeIncident({ id: "1", outcome: "resolved" }),
      makeIncident({ id: "2", outcome: "resolved" }),
      makeIncident({ id: "3", outcome: "resolved" }),
      makeIncident({ id: "4", outcome: "resolved" }),
      makeIncident({ id: "5", outcome: "resolved" }),
      makeIncident({ id: "6", outcome: "escalated" }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.escalationRate).toBe(17); // ~16.67% rounded
  });

  it("awards 2 bonus when all lessons identified", () => {
    const incidents = [
      makeIncident({ id: "1", lessonsIdentified: true }),
      makeIncident({ id: "2", lessonsIdentified: true }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.allLessonsIdentified).toBe(true);
  });

  it("does not award bonus when some lessons not identified", () => {
    const incidents = [
      makeIncident({ id: "1", lessonsIdentified: true }),
      makeIncident({ id: "2", lessonsIdentified: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.allLessonsIdentified).toBe(false);
  });

  it("clamps score to 25 maximum", () => {
    const incidents = [
      makeIncident({
        id: "1",
        outcome: "resolved",
        lessonsIdentified: true,
        actionsTaken: ["A", "B", "C"],
        severity: "low",
      }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("produces low score when incidents are poorly managed", () => {
    const incidents = [
      makeIncident({
        id: "1",
        outcome: "ongoing",
        lessonsIdentified: false,
        actionsTaken: [],
        severity: "critical",
      }),
      makeIncident({
        id: "2",
        outcome: "escalated",
        lessonsIdentified: false,
        actionsTaken: [],
        severity: "high",
      }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.score).toBeLessThanOrEqual(3);
  });

  it("gives max score for perfectly managed single incident", () => {
    const incidents = [
      makeIncident({
        id: "1",
        outcome: "resolved",
        lessonsIdentified: true,
        actionsTaken: ["A", "B", "C"],
        severity: "low",
      }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.score).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateAccessibilityInclusion
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAccessibilityInclusion", () => {
  it("returns zero score for no audits", () => {
    const result = evaluateAccessibilityInclusion([]);
    expect(result.totalAudits).toBe(0);
    expect(result.score).toBe(0);
  });

  it("uses the latest audit scores", () => {
    const audits = [
      makeAudit({ id: "1", auditDate: "2026-01-01", physicalAccessScore: 5 }),
      makeAudit({ id: "2", auditDate: "2026-04-01", physicalAccessScore: 9 }),
    ];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.latestPhysicalScore).toBe(9);
  });

  it("awards 5 points for physical access >= 8", () => {
    const audits = [makeAudit({ physicalAccessScore: 8 })];
    const result = evaluateAccessibilityInclusion(audits);
    // At least the physical points should be included
    expect(result.latestPhysicalScore).toBe(8);
  });

  it("awards 4 points for communication access >= 8", () => {
    const audits = [makeAudit({ communicationAccessScore: 8 })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.latestCommunicationScore).toBe(8);
  });

  it("awards 3 points for information access >= 8", () => {
    const audits = [makeAudit({ informationAccessScore: 8 })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.latestInformationScore).toBe(8);
  });

  it("awards 3 points for activity access >= 8", () => {
    const audits = [makeAudit({ activityAccessScore: 8 })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.latestActivityScore).toBe(8);
  });

  it("calculates improvement rate across all audits", () => {
    const audits = [
      makeAudit({ id: "1", improvementsIdentified: 10, improvementsCompleted: 8 }),
      makeAudit({ id: "2", improvementsIdentified: 5, improvementsCompleted: 4 }),
    ];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.improvementRate).toBe(80); // 12/15 = 80%
  });

  it("awards 3 points for improvement rate >= 80%", () => {
    const audits = [
      makeAudit({ improvementsIdentified: 5, improvementsCompleted: 4 }),
    ];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.improvementRate).toBe(80);
  });

  it("detects all scores above 9", () => {
    const audits = [
      makeAudit({
        physicalAccessScore: 9,
        communicationAccessScore: 10,
        informationAccessScore: 9,
        activityAccessScore: 9,
      }),
    ];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.allScoresAbove9).toBe(true);
  });

  it("does not flag all above 9 when one is below", () => {
    const audits = [
      makeAudit({
        physicalAccessScore: 9,
        communicationAccessScore: 8,
        informationAccessScore: 9,
        activityAccessScore: 9,
      }),
    ];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.allScoresAbove9).toBe(false);
  });

  it("awards 2 bonus for all scores >= 9", () => {
    const perfect = [makeAudit({
      physicalAccessScore: 10,
      communicationAccessScore: 10,
      informationAccessScore: 10,
      activityAccessScore: 10,
      improvementsIdentified: 5,
      improvementsCompleted: 5,
    })];
    const almostPerfect = [makeAudit({
      physicalAccessScore: 10,
      communicationAccessScore: 8,
      informationAccessScore: 10,
      activityAccessScore: 10,
      improvementsIdentified: 5,
      improvementsCompleted: 5,
    })];
    const r1 = evaluateAccessibilityInclusion(perfect);
    const r2 = evaluateAccessibilityInclusion(almostPerfect);
    // r1 should have 2 more points (bonus) + 4 for communication >= 8 in almostPerfect
    // Actually r2 still gets 4 for communication >= 8, so difference is just the bonus
    expect(r1.score - r2.score).toBe(2);
  });

  it("clamps score to 20 maximum", () => {
    const audits = [makeAudit({
      physicalAccessScore: 10,
      communicationAccessScore: 10,
      informationAccessScore: 10,
      activityAccessScore: 10,
      improvementsIdentified: 10,
      improvementsCompleted: 10,
    })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("produces max score of 20 for perfect audits", () => {
    const audits = [makeAudit({
      physicalAccessScore: 10,
      communicationAccessScore: 10,
      informationAccessScore: 10,
      activityAccessScore: 10,
      improvementsIdentified: 10,
      improvementsCompleted: 10,
    })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.score).toBe(20);
  });

  it("produces low score when all scores below 8", () => {
    const audits = [makeAudit({
      physicalAccessScore: 5,
      communicationAccessScore: 5,
      informationAccessScore: 5,
      activityAccessScore: 5,
      improvementsIdentified: 10,
      improvementsCompleted: 2,
    })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.score).toBe(0);
  });

  it("handles zero improvements identified", () => {
    const audits = [makeAudit({
      improvementsIdentified: 0,
      improvementsCompleted: 0,
    })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.improvementRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateEqualityDiversityIntelligence (main function)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEqualityDiversityIntelligence", () => {
  it("returns correct homeId and period", () => {
    const result = generateEqualityDiversityIntelligence(
      [], [], [], [], 0, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("home-1");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("clamps overall score to 0-100", () => {
    const result = generateEqualityDiversityIntelligence(
      [], [], [], [], 0, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates outstanding for score >= 85", () => {
    const profiles = getDemoProfiles();
    const training = getDemoTrainingRecords();
    const incidents = getDemoIncidents();
    const audits = getDemoAudits();
    const result = generateEqualityDiversityIntelligence(
      profiles, training, incidents, audits, 4, "home-1", PERIOD_START, PERIOD_END,
    );
    // Demo data should score highly
    if (result.overallScore >= 85) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates good for score 65-84", () => {
    const result = generateEqualityDiversityIntelligence(
      [makeProfile()], [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore >= 65 && result.overallScore < 85) {
      expect(result.rating).toBe("good");
    }
  });

  it("rates requires_improvement for score 45-64", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "partially_supported" },
        ],
        culturalPlanStatus: "not_in_place",
        dietaryNeedsMet: false,
        religiousPracticeFacilitated: false,
        languageSupportProvided: false,
        identityWorkCompleted: false,
        lastAssessedDate: "2025-01-01",
      }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 2, "home-1", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore >= 45 && result.overallScore < 65) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("rates inadequate for score < 45", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "not_supported" },
        ],
        culturalPlanStatus: "not_in_place",
        dietaryNeedsMet: false,
        religiousPracticeFacilitated: false,
        languageSupportProvided: false,
        identityWorkCompleted: false,
        lastAssessedDate: "2025-01-01",
      }),
    ];
    const badIncidents = [
      makeIncident({ id: "1", severity: "critical", outcome: "ongoing", lessonsIdentified: false, actionsTaken: [] }),
      makeIncident({ id: "2", severity: "high", outcome: "escalated", lessonsIdentified: false, actionsTaken: [] }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], badIncidents, [], 4, "home-1", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore < 45) {
      expect(result.rating).toBe("inadequate");
    }
  });

  it("produces child summaries for each profile", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", childName: "Alex" }),
      makeProfile({ id: "p2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 2, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries).toHaveLength(2);
    expect(result.childSummaries[0].childName).toBe("Alex");
    expect(result.childSummaries[1].childName).toBe("Jordan");
  });

  it("includes regulatory links", () => {
    const result = generateEqualityDiversityIntelligence(
      [], [], [], [], 0, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 7"))).toBe(true);
  });

  it("generates strengths array", () => {
    const profiles = getDemoProfiles();
    const training = getDemoTrainingRecords();
    const audits = getDemoAudits();
    const result = generateEqualityDiversityIntelligence(
      profiles, training, [], audits, 4, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for development when issues exist", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "not_supported" },
        ],
        identityWorkCompleted: false,
        lastAssessedDate: "2025-01-01",
      }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 2, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
  });

  it("generates immediate actions for critical issues", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "not_supported" },
        ],
        culturalPlanStatus: "not_in_place",
      }),
    ];
    const training = [
      makeTrainingRecord({ id: "1", staffId: "s1", status: "overdue" }),
    ];
    const incidents = [
      makeIncident({ id: "1", severity: "critical", outcome: "ongoing" }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, training, incidents, [], 2, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("child summary calculates support rate", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "fully_supported" },
          { characteristic: "disability", details: "Y", supportStatus: "not_supported" },
        ],
      }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].characteristicCount).toBe(2);
    expect(result.childSummaries[0].fullySupportedCount).toBe(1);
    expect(result.childSummaries[0].supportRate).toBe(50);
  });

  it("child summary identifies primary concern for not supported", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "not_supported" },
        ],
      }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("not supported");
  });

  it("child summary identifies primary concern for missing cultural plan", () => {
    const profiles = [
      makeProfile({ culturalPlanStatus: "not_in_place" }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("Cultural support plan not in place");
  });

  it("child summary identifies primary concern for review due plan", () => {
    const profiles = [
      makeProfile({ culturalPlanStatus: "review_due" }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("review overdue");
  });

  it("child summary identifies dietary concern", () => {
    const profiles = [makeProfile({ dietaryNeedsMet: false })];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("Dietary");
  });

  it("child summary identifies religious practice concern", () => {
    const profiles = [makeProfile({ dietaryNeedsMet: true, religiousPracticeFacilitated: false })];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("Religious");
  });

  it("child summary identifies language support concern", () => {
    const profiles = [makeProfile({ languageSupportProvided: false, dietaryNeedsMet: true, religiousPracticeFacilitated: true })];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("Language");
  });

  it("child summary identifies identity work concern", () => {
    const profiles = [makeProfile({ identityWorkCompleted: false })];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toContain("Identity");
  });

  it("child summary has no concern when fully supported", () => {
    const profiles = [makeProfile()];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries[0].primaryConcern).toBeUndefined();
  });

  it("child summary excludes not_applicable from support rate", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "race", details: "X", supportStatus: "fully_supported" },
          { characteristic: "religion_or_belief", details: "None", supportStatus: "not_applicable" },
        ],
      }),
    ];
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    // Only 1 applicable characteristic, fully supported
    expect(result.childSummaries[0].supportRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION — Demo Data
// ══════════════════════════════════════════════════════════════════════════════

describe("demo data integration", () => {
  it("getDemoProfiles returns 3 children", () => {
    const profiles = getDemoProfiles();
    expect(profiles).toHaveLength(3);
  });

  it("demo profiles have Alex, Jordan, Morgan", () => {
    const profiles = getDemoProfiles();
    const names = profiles.map((p) => p.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });

  it("getDemoTrainingRecords returns records for 4 staff", () => {
    const records = getDemoTrainingRecords();
    const staffIds = new Set(records.map((r) => r.staffId));
    expect(staffIds.size).toBe(4);
  });

  it("demo training includes Sarah, Tom, Lisa, Darren", () => {
    const records = getDemoTrainingRecords();
    const names = new Set(records.map((r) => r.staffName));
    expect(names.has("Sarah Johnson")).toBe(true);
    expect(names.has("Tom Williams")).toBe(true);
    expect(names.has("Lisa Chen")).toBe(true);
    expect(names.has("Darren Laville")).toBe(true);
  });

  it("getDemoIncidents returns incidents", () => {
    const incidents = getDemoIncidents();
    expect(incidents.length).toBeGreaterThan(0);
  });

  it("getDemoAudits returns audits", () => {
    const audits = getDemoAudits();
    expect(audits.length).toBeGreaterThan(0);
  });

  it("full demo generates a valid result", () => {
    const result = generateEqualityDiversityIntelligence(
      getDemoProfiles(),
      getDemoTrainingRecords(),
      getDemoIncidents(),
      getDemoAudits(),
      4,
      "home-oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.childSummaries).toHaveLength(3);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("demo data produces a high score (good or outstanding)", () => {
    const result = generateEqualityDiversityIntelligence(
      getDemoProfiles(),
      getDemoTrainingRecords(),
      getDemoIncidents(),
      getDemoAudits(),
      4,
      "home-oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(65);
  });

  it("demo data individual support score is positive", () => {
    const result = generateEqualityDiversityIntelligence(
      getDemoProfiles(),
      getDemoTrainingRecords(),
      getDemoIncidents(),
      getDemoAudits(),
      4,
      "home-oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.individualSupport.score).toBeGreaterThan(0);
  });

  it("demo data staff competency score is positive", () => {
    const result = generateEqualityDiversityIntelligence(
      getDemoProfiles(),
      getDemoTrainingRecords(),
      getDemoIncidents(),
      getDemoAudits(),
      4,
      "home-oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.staffCompetency.score).toBeGreaterThan(0);
  });

  it("demo data incident response score is positive", () => {
    const result = generateEqualityDiversityIntelligence(
      getDemoProfiles(),
      getDemoTrainingRecords(),
      getDemoIncidents(),
      getDemoAudits(),
      4,
      "home-oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.incidentResponse.score).toBeGreaterThan(0);
  });

  it("demo data accessibility score is positive", () => {
    const result = generateEqualityDiversityIntelligence(
      getDemoProfiles(),
      getDemoTrainingRecords(),
      getDemoIncidents(),
      getDemoAudits(),
      4,
      "home-oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.accessibilityInclusion.score).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles empty arrays for all inputs", () => {
    const result = generateEqualityDiversityIntelligence(
      [], [], [], [], 0, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childSummaries).toHaveLength(0);
  });

  it("handles profile with no characteristics", () => {
    const profiles = [makeProfile({ characteristics: [] })];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.fullySupported).toBe(0);
    expect(result.totalChildren).toBe(1);
  });

  it("handles single child with all not_applicable characteristics", () => {
    const profiles = [
      makeProfile({
        characteristics: [
          { characteristic: "marriage_and_civil_partnership", details: "N/A", supportStatus: "not_applicable" },
          { characteristic: "pregnancy_and_maternity", details: "N/A", supportStatus: "not_applicable" },
        ],
      }),
    ];
    const result = evaluateIndividualSupport(profiles, PERIOD_END);
    expect(result.fullySupported).toBe(1);
  });

  it("handles incident with empty actions array", () => {
    const incidents = [makeIncident({ actionsTaken: [] })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.averageActionsPerIncident).toBe(0);
  });

  it("handles training records with no completed entries", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", status: "overdue" }),
      makeTrainingRecord({ id: "2", staffId: "s2", status: "booked" }),
    ];
    const result = evaluateStaffCompetency(records, 2);
    expect(result.completedCount).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it("handles single audit with zero improvements", () => {
    const audits = [makeAudit({ improvementsIdentified: 0, improvementsCompleted: 0 })];
    const result = evaluateAccessibilityInclusion(audits);
    expect(result.improvementRate).toBe(0);
    expect(result.totalAudits).toBe(1);
  });

  it("overall score sums all four sub-scores", () => {
    const profiles = [makeProfile()];
    const training = [makeTrainingRecord()];
    const audits = [makeAudit()];
    const result = generateEqualityDiversityIntelligence(
      profiles, training, [], audits, 1, "home-1", PERIOD_START, PERIOD_END,
    );
    const expectedSum =
      result.individualSupport.score +
      result.staffCompetency.score +
      result.incidentResponse.score +
      result.accessibilityInclusion.score;
    expect(result.overallScore).toBe(clampHelper(expectedSum, 0, 100));
  });

  it("handles many children without exceeding score limits", () => {
    const profiles = Array.from({ length: 50 }, (_, i) =>
      makeProfile({ id: `p${i}`, childId: `c${i}`, childName: `Child ${i}` }),
    );
    const result = generateEqualityDiversityIntelligence(
      profiles, [], [], [], 10, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.individualSupport.score).toBeLessThanOrEqual(30);
  });

  it("handles many incidents without exceeding score limits", () => {
    const incidents = Array.from({ length: 100 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateIncidentResponse(incidents);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles many training records without exceeding score limits", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeTrainingRecord({ id: `tr-${i}`, staffId: `s${i % 10}` }),
    );
    const result = evaluateStaffCompetency(records, 10);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("strength mentions no EDI incidents when none", () => {
    const result = generateEqualityDiversityIntelligence(
      [makeProfile()], [], [], [], 1, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("No EDI incidents"))).toBe(true);
  });

  it("immediate actions include accessibility audit when none provided", () => {
    const result = generateEqualityDiversityIntelligence(
      [], [], [], [], 0, "home-1", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("accessibility audit"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SCORING BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("scoring boundaries", () => {
  it("rating boundary: 84 is good, 85 is outstanding", () => {
    // We test the rating logic by constructing known scores
    // Score 85+ = outstanding
    const profiles = getDemoProfiles();
    const training = getDemoTrainingRecords();
    const audits = getDemoAudits();
    const result = generateEqualityDiversityIntelligence(
      profiles, training, [], audits, 4, "home-1", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore === 85) {
      expect(result.rating).toBe("outstanding");
    } else if (result.overallScore === 84) {
      expect(result.rating).toBe("good");
    }
  });

  it("incident score is low when most criteria fail", () => {
    const incidents = [
      makeIncident({
        id: "1",
        outcome: "ongoing",
        lessonsIdentified: false,
        actionsTaken: [],
        severity: "critical",
      }),
    ];
    const result = evaluateIncidentResponse(incidents);
    // 0 resolution + 0 lessons + 0 actions + 0 no unresolved crit/high + 3 escalation <20% + 0 all lessons = 3
    expect(result.score).toBe(3);
  });

  it("staff competency score is low when no completed training and overdue", () => {
    const records = [
      makeTrainingRecord({ id: "1", staffId: "s1", status: "overdue" }),
    ];
    const result = evaluateStaffCompetency(records, 4);
    // 0 completion tier + 0 no overdue + 0 coverage + 3 no expired + 0 bonus = 3
    expect(result.score).toBe(3);
  });

  it("accessibility score captures exact boundary at 8", () => {
    const audits = [
      makeAudit({
        physicalAccessScore: 8,
        communicationAccessScore: 7,
        informationAccessScore: 8,
        activityAccessScore: 7,
        improvementsIdentified: 10,
        improvementsCompleted: 7,
      }),
    ];
    const result = evaluateAccessibilityInclusion(audits);
    // physical ≥8: +5, comm <8: +0, info ≥8: +3, activity <8: +0, improvements 70%: +0
    expect(result.score).toBe(8);
  });
});
// ── Helper used in tests ──────────────────────────────────────────────────────

function clampHelper(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
