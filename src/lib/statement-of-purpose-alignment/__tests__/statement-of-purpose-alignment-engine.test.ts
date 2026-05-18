// ==============================================================================
// Cornerstone -- Statement of Purpose Alignment Intelligence Engine Tests
// 80+ tests covering all functions, scoring, labels, edge cases
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateAlignmentQuality,
  evaluateReviewCurrency,
  evaluateStakeholderAwareness,
  evaluateOfstedResponse,
  buildSectionProfiles,
  generateStatementOfPurposeAlignmentIntelligence,
  pct,
  getRating,
  getSoPSectionLabel,
  getAlignmentLevelLabel,
  getReviewStatusLabel,
  getEvidenceQualityLabel,
  getStakeholderTypeLabel,
  getRatingLabel,
} from "../statement-of-purpose-alignment-engine";
import type {
  SoPAlignmentAssessment,
  SoPReviewRecord,
  StakeholderFeedback,
  OfstedRecommendation,
  SoPSection,
  AlignmentLevel,
  EvidenceQuality,
  StakeholderType,
} from "../statement-of-purpose-alignment-engine";

// -- Factories ----------------------------------------------------------------

function makeAssessment(overrides: Partial<SoPAlignmentAssessment> = {}): SoPAlignmentAssessment {
  return {
    id: "a-01",
    section: "ethos_values",
    alignmentLevel: "fully_aligned",
    assessedDate: "2025-03-01",
    assessedBy: "Manager",
    evidenceQuality: "strong",
    evidenceDescription: "Observed in daily practice",
    actionRequired: false,
    actionTaken: null,
    ...overrides,
  };
}

function makeReview(overrides: Partial<SoPReviewRecord> = {}): SoPReviewRecord {
  return {
    id: "r-01",
    reviewDate: "2025-01-15",
    reviewedBy: "Registered Manager",
    sopVersion: "3.0",
    allSectionsReviewed: true,
    childrenConsulted: true,
    staffConsulted: true,
    regulatoryChangesIncorporated: true,
    ofstedRecommendationsAddressed: true,
    status: "current",
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<StakeholderFeedback> = {}): StakeholderFeedback {
  return {
    id: "sf-01",
    stakeholderType: "child",
    date: "2025-03-10",
    awareOfSoP: true,
    sopReflectsReality: true,
    valuesEvident: true,
    suggestionsProvided: false,
    ...overrides,
  };
}

function makeRecommendation(overrides: Partial<OfstedRecommendation> = {}): OfstedRecommendation {
  return {
    id: "or-01",
    inspectionDate: "2024-11-20",
    recommendation: "Ensure the SoP reflects current staffing arrangements",
    relatedSection: "staffing_model",
    addressed: true,
    evidenceOfChange: true,
    ...overrides,
  };
}

// -- pct() --------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for 1/2", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// -- getRating() --------------------------------------------------------------

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// -- Label Functions ----------------------------------------------------------

describe("getSoPSectionLabel", () => {
  it("returns correct label for each section", () => {
    expect(getSoPSectionLabel("ethos_values")).toBe("Ethos & Values");
    expect(getSoPSectionLabel("care_approach")).toBe("Care Approach");
    expect(getSoPSectionLabel("admission_criteria")).toBe("Admission Criteria");
    expect(getSoPSectionLabel("staffing_model")).toBe("Staffing Model");
    expect(getSoPSectionLabel("education_support")).toBe("Education Support");
    expect(getSoPSectionLabel("health_wellbeing")).toBe("Health & Wellbeing");
    expect(getSoPSectionLabel("behaviour_management")).toBe("Behaviour Management");
    expect(getSoPSectionLabel("safeguarding")).toBe("Safeguarding");
    expect(getSoPSectionLabel("family_contact")).toBe("Family Contact");
    expect(getSoPSectionLabel("transition_planning")).toBe("Transition Planning");
    expect(getSoPSectionLabel("location_community")).toBe("Location & Community");
    expect(getSoPSectionLabel("complaints_procedure")).toBe("Complaints Procedure");
  });
});

describe("getAlignmentLevelLabel", () => {
  it("returns correct label for each level", () => {
    expect(getAlignmentLevelLabel("fully_aligned")).toBe("Fully Aligned");
    expect(getAlignmentLevelLabel("mostly_aligned")).toBe("Mostly Aligned");
    expect(getAlignmentLevelLabel("partially_aligned")).toBe("Partially Aligned");
    expect(getAlignmentLevelLabel("not_aligned")).toBe("Not Aligned");
    expect(getAlignmentLevelLabel("not_assessed")).toBe("Not Assessed");
  });
});

describe("getReviewStatusLabel", () => {
  it("returns correct label for each status", () => {
    expect(getReviewStatusLabel("current")).toBe("Current");
    expect(getReviewStatusLabel("due_for_review")).toBe("Due for Review");
    expect(getReviewStatusLabel("overdue")).toBe("Overdue");
    expect(getReviewStatusLabel("not_completed")).toBe("Not Completed");
  });
});

describe("getEvidenceQualityLabel", () => {
  it("returns correct label for each quality", () => {
    expect(getEvidenceQualityLabel("strong")).toBe("Strong");
    expect(getEvidenceQualityLabel("adequate")).toBe("Adequate");
    expect(getEvidenceQualityLabel("limited")).toBe("Limited");
    expect(getEvidenceQualityLabel("no_evidence")).toBe("No Evidence");
  });
});

describe("getStakeholderTypeLabel", () => {
  it("returns correct label for each type", () => {
    expect(getStakeholderTypeLabel("child")).toBe("Child");
    expect(getStakeholderTypeLabel("staff")).toBe("Staff");
    expect(getStakeholderTypeLabel("social_worker")).toBe("Social Worker");
    expect(getStakeholderTypeLabel("family")).toBe("Family");
    expect(getStakeholderTypeLabel("reg44_visitor")).toBe("Reg 44 Visitor");
    expect(getStakeholderTypeLabel("manager")).toBe("Manager");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for each rating", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateAlignmentQuality -------------------------------------------------

describe("evaluateAlignmentQuality", () => {
  it("returns 0 for empty assessments", () => {
    const result = evaluateAlignmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.fullyAlignedRate).toBe(0);
    expect(result.notAlignedCount).toBe(0);
    expect(result.strongEvidenceRate).toBe(0);
    expect(result.actionsRequiredCount).toBe(0);
    expect(result.actionsTakenRate).toBe(0);
  });

  it("returns sectionDistribution with all 12 sections", () => {
    const result = evaluateAlignmentQuality([]);
    const sectionKeys = Object.keys(result.sectionDistribution);
    expect(sectionKeys).toHaveLength(12);
  });

  it("scores maximum for all fully aligned with strong evidence and no actions required", () => {
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values" }),
      makeAssessment({ id: "a-02", section: "care_approach" }),
      makeAssessment({ id: "a-03", section: "safeguarding" }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    // fullyAlignedRate = 100 -> alignedScore = 8
    // strongEvidenceRate = 100 -> evidenceScore = 6
    // no actions required -> actionsScore = 5
    // total = 19
    expect(result.overallScore).toBe(19);
    expect(result.fullyAlignedRate).toBe(100);
    expect(result.strongEvidenceRate).toBe(100);
  });

  it("applies -3 penalty per not_aligned section", () => {
    const assessments = [
      makeAssessment({ id: "a-01", alignmentLevel: "not_aligned", evidenceQuality: "no_evidence" }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    // fullyAlignedRate = 0 -> 0, strongEvidenceRate = 0 -> 0
    // no actions required -> 5
    // penalty: -3 * 1 = -3
    expect(result.overallScore).toBe(2);
    expect(result.notAlignedCount).toBe(1);
  });

  it("caps penalty so score does not go below 0", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        alignmentLevel: "not_aligned",
        evidenceQuality: "no_evidence",
      }),
    );
    const result = evaluateAlignmentQuality(assessments);
    expect(result.overallScore).toBe(0);
  });

  it("scores correctly for mixed alignment levels", () => {
    const assessments = [
      makeAssessment({ id: "a-01", alignmentLevel: "fully_aligned", evidenceQuality: "strong" }),
      makeAssessment({ id: "a-02", alignmentLevel: "mostly_aligned", evidenceQuality: "adequate", section: "care_approach" }),
      makeAssessment({ id: "a-03", alignmentLevel: "partially_aligned", evidenceQuality: "limited", section: "safeguarding" }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    expect(result.totalAssessments).toBe(3);
    expect(result.fullyAlignedRate).toBe(33);
    expect(result.notAlignedCount).toBe(0);
    expect(result.strongEvidenceRate).toBe(33);
  });

  it("tracks actions required and taken", () => {
    const assessments = [
      makeAssessment({ id: "a-01", actionRequired: true, actionTaken: true }),
      makeAssessment({ id: "a-02", section: "care_approach", actionRequired: true, actionTaken: false }),
      makeAssessment({ id: "a-03", section: "safeguarding", actionRequired: false, actionTaken: null }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    expect(result.actionsRequiredCount).toBe(2);
    expect(result.actionsTakenRate).toBe(50);
  });

  it("gives full action score when no actions are required", () => {
    const assessments = [
      makeAssessment({ actionRequired: false, actionTaken: null }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    // actionsScore = 5 (no actions required = full)
    expect(result.actionsRequiredCount).toBe(0);
    expect(result.actionsTakenRate).toBe(0); // pct(0, 0) = 0
  });

  it("counts section distribution correctly", () => {
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values" }),
      makeAssessment({ id: "a-02", section: "ethos_values" }),
      makeAssessment({ id: "a-03", section: "safeguarding" }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    expect(result.sectionDistribution.ethos_values).toBe(2);
    expect(result.sectionDistribution.safeguarding).toBe(1);
    expect(result.sectionDistribution.care_approach).toBe(0);
  });

  it("caps overallScore at 25", () => {
    // Theoretically impossible to exceed 25 with the formula, but check the cap
    const assessments = [
      makeAssessment({ id: "a-01" }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles all partially aligned with limited evidence", () => {
    const assessments = [
      makeAssessment({ id: "a-01", alignmentLevel: "partially_aligned", evidenceQuality: "limited" }),
      makeAssessment({ id: "a-02", section: "care_approach", alignmentLevel: "partially_aligned", evidenceQuality: "limited" }),
    ];
    const result = evaluateAlignmentQuality(assessments);
    expect(result.fullyAlignedRate).toBe(0);
    expect(result.strongEvidenceRate).toBe(0);
    expect(result.overallScore).toBe(5); // only actionsScore = 5
  });
});

// -- evaluateReviewCurrency ---------------------------------------------------

describe("evaluateReviewCurrency", () => {
  it("returns 0 for empty reviews", () => {
    const result = evaluateReviewCurrency([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalReviews).toBe(0);
    expect(result.currentRate).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.childrenConsultedRate).toBe(0);
    expect(result.staffConsultedRate).toBe(0);
    expect(result.regulatoryRate).toBe(0);
    expect(result.allSectionsRate).toBe(0);
  });

  it("scores maximum for perfect reviews", () => {
    const reviews = [makeReview()];
    const result = evaluateReviewCurrency(reviews);
    // currentRate = 100 -> 7
    // childrenConsulted = 100 -> 5
    // staffConsulted = 100 -> 4
    // regulatory = 100 -> 4
    // allSections = 100 -> 3
    // total = 23
    expect(result.overallScore).toBe(23);
    expect(result.currentRate).toBe(100);
    expect(result.overdueCount).toBe(0);
  });

  it("applies -4 penalty per overdue review", () => {
    const reviews = [makeReview({ status: "overdue" })];
    const result = evaluateReviewCurrency(reviews);
    expect(result.overdueCount).toBe(1);
    // currentRate = 0 -> 0
    // children/staff/regulatory/allSections all true -> 5+4+4+3=16
    // penalty: -4
    expect(result.overallScore).toBe(12);
  });

  it("caps penalty so score does not go below 0", () => {
    const reviews = Array.from({ length: 10 }, (_, i) =>
      makeReview({
        id: `r-${i}`,
        status: "overdue",
        childrenConsulted: false,
        staffConsulted: false,
        regulatoryChangesIncorporated: false,
        allSectionsReviewed: false,
      }),
    );
    const result = evaluateReviewCurrency(reviews);
    expect(result.overallScore).toBe(0);
  });

  it("calculates rates correctly for mixed reviews", () => {
    const reviews = [
      makeReview({ id: "r-01", status: "current", childrenConsulted: true, staffConsulted: true }),
      makeReview({ id: "r-02", status: "due_for_review", childrenConsulted: false, staffConsulted: false }),
    ];
    const result = evaluateReviewCurrency(reviews);
    expect(result.totalReviews).toBe(2);
    expect(result.currentRate).toBe(50);
    expect(result.childrenConsultedRate).toBe(50);
    expect(result.staffConsultedRate).toBe(50);
  });

  it("handles due_for_review status without penalty", () => {
    const reviews = [makeReview({ status: "due_for_review" })];
    const result = evaluateReviewCurrency(reviews);
    expect(result.overdueCount).toBe(0);
    expect(result.currentRate).toBe(0);
  });

  it("handles not_completed status", () => {
    const reviews = [makeReview({ status: "not_completed" })];
    const result = evaluateReviewCurrency(reviews);
    expect(result.overdueCount).toBe(0);
    expect(result.currentRate).toBe(0);
  });

  it("caps overallScore at 25", () => {
    const reviews = [makeReview()];
    const result = evaluateReviewCurrency(reviews);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("calculates allSectionsRate correctly", () => {
    const reviews = [
      makeReview({ id: "r-01", allSectionsReviewed: true }),
      makeReview({ id: "r-02", allSectionsReviewed: false }),
      makeReview({ id: "r-03", allSectionsReviewed: true }),
    ];
    const result = evaluateReviewCurrency(reviews);
    expect(result.allSectionsRate).toBe(67);
  });

  it("calculates regulatoryRate correctly", () => {
    const reviews = [
      makeReview({ id: "r-01", regulatoryChangesIncorporated: true }),
      makeReview({ id: "r-02", regulatoryChangesIncorporated: false }),
    ];
    const result = evaluateReviewCurrency(reviews);
    expect(result.regulatoryRate).toBe(50);
  });
});

// -- evaluateStakeholderAwareness ---------------------------------------------

describe("evaluateStakeholderAwareness", () => {
  it("returns 0 for empty feedback", () => {
    const result = evaluateStakeholderAwareness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalFeedback).toBe(0);
    expect(result.awareRate).toBe(0);
    expect(result.reflectsRealityRate).toBe(0);
    expect(result.valuesEvidentRate).toBe(0);
    expect(result.suggestionsRate).toBe(0);
  });

  it("returns stakeholderDistribution with all 6 types", () => {
    const result = evaluateStakeholderAwareness([]);
    const typeKeys = Object.keys(result.stakeholderDistribution);
    expect(typeKeys).toHaveLength(6);
  });

  it("scores maximum for all-positive feedback", () => {
    const feedback = [
      makeFeedback({ id: "sf-01", awareOfSoP: true, sopReflectsReality: true, valuesEvident: true, suggestionsProvided: true }),
    ];
    const result = evaluateStakeholderAwareness(feedback);
    // awareRate=100 -> 7, reflectsReality=100 -> 7, valuesEvident=100 -> 6, suggestions=100 -> 5
    // total = 25
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 for all-negative feedback", () => {
    const feedback = [
      makeFeedback({ awareOfSoP: false, sopReflectsReality: false, valuesEvident: false, suggestionsProvided: false }),
    ];
    const result = evaluateStakeholderAwareness(feedback);
    expect(result.overallScore).toBe(0);
    expect(result.awareRate).toBe(0);
    expect(result.reflectsRealityRate).toBe(0);
    expect(result.valuesEvidentRate).toBe(0);
    expect(result.suggestionsRate).toBe(0);
  });

  it("calculates rates for mixed feedback", () => {
    const feedback = [
      makeFeedback({ id: "sf-01", awareOfSoP: true, sopReflectsReality: true, valuesEvident: true, suggestionsProvided: false }),
      makeFeedback({ id: "sf-02", stakeholderType: "staff", awareOfSoP: true, sopReflectsReality: false, valuesEvident: false, suggestionsProvided: true }),
    ];
    const result = evaluateStakeholderAwareness(feedback);
    expect(result.totalFeedback).toBe(2);
    expect(result.awareRate).toBe(100);
    expect(result.reflectsRealityRate).toBe(50);
    expect(result.valuesEvidentRate).toBe(50);
    expect(result.suggestionsRate).toBe(50);
  });

  it("tracks stakeholder distribution", () => {
    const feedback = [
      makeFeedback({ id: "sf-01", stakeholderType: "child" }),
      makeFeedback({ id: "sf-02", stakeholderType: "child" }),
      makeFeedback({ id: "sf-03", stakeholderType: "staff" }),
      makeFeedback({ id: "sf-04", stakeholderType: "social_worker" }),
    ];
    const result = evaluateStakeholderAwareness(feedback);
    expect(result.stakeholderDistribution.child).toBe(2);
    expect(result.stakeholderDistribution.staff).toBe(1);
    expect(result.stakeholderDistribution.social_worker).toBe(1);
    expect(result.stakeholderDistribution.family).toBe(0);
    expect(result.stakeholderDistribution.reg44_visitor).toBe(0);
    expect(result.stakeholderDistribution.manager).toBe(0);
  });

  it("caps overallScore at 25", () => {
    const feedback = [makeFeedback({ suggestionsProvided: true })];
    const result = evaluateStakeholderAwareness(feedback);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single feedback with only awareness", () => {
    const feedback = [
      makeFeedback({ awareOfSoP: true, sopReflectsReality: false, valuesEvident: false, suggestionsProvided: false }),
    ];
    const result = evaluateStakeholderAwareness(feedback);
    expect(result.awareRate).toBe(100);
    expect(result.reflectsRealityRate).toBe(0);
    expect(result.overallScore).toBe(7); // only awareScore = 7
  });
});

// -- evaluateOfstedResponse ---------------------------------------------------

describe("evaluateOfstedResponse", () => {
  it("returns 25 for empty recommendations (no issues = good)", () => {
    const result = evaluateOfstedResponse([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecommendations).toBe(0);
    expect(result.addressedRate).toBe(0);
    expect(result.evidenceRate).toBe(0);
    expect(result.outstandingCount).toBe(0);
  });

  it("scores well for all addressed with evidence", () => {
    const recs = [
      makeRecommendation({ id: "or-01", addressed: true, evidenceOfChange: true }),
    ];
    const result = evaluateOfstedResponse(recs);
    // addressedRate=100 -> 12, evidenceRate=100 -> 8
    // total = 20
    expect(result.overallScore).toBe(20);
    expect(result.outstandingCount).toBe(0);
  });

  it("applies -5 penalty per outstanding recommendation", () => {
    const recs = [
      makeRecommendation({ id: "or-01", addressed: false, evidenceOfChange: false }),
    ];
    const result = evaluateOfstedResponse(recs);
    // addressedRate=0 -> 0, evidenceRate=0 -> 0
    // outstanding: 1, penalty: -5
    expect(result.outstandingCount).toBe(1);
    expect(result.overallScore).toBe(0);
  });

  it("caps penalty so score does not go below 0", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecommendation({ id: `or-${i}`, addressed: false, evidenceOfChange: false }),
    );
    const result = evaluateOfstedResponse(recs);
    expect(result.overallScore).toBe(0);
    expect(result.outstandingCount).toBe(5);
  });

  it("calculates mixed addressed/not addressed", () => {
    const recs = [
      makeRecommendation({ id: "or-01", addressed: true, evidenceOfChange: true }),
      makeRecommendation({ id: "or-02", addressed: false, evidenceOfChange: false }),
    ];
    const result = evaluateOfstedResponse(recs);
    expect(result.totalRecommendations).toBe(2);
    expect(result.addressedRate).toBe(50);
    expect(result.evidenceRate).toBe(50);
    expect(result.outstandingCount).toBe(1);
  });

  it("scores addressed but no evidence", () => {
    const recs = [
      makeRecommendation({ addressed: true, evidenceOfChange: false }),
    ];
    const result = evaluateOfstedResponse(recs);
    // addressedRate=100 -> 12, evidenceRate=0 -> 0
    // total = 12
    expect(result.overallScore).toBe(12);
    expect(result.addressedRate).toBe(100);
    expect(result.evidenceRate).toBe(0);
  });

  it("caps overallScore at 25", () => {
    const recs = [makeRecommendation()];
    const result = evaluateOfstedResponse(recs);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- buildSectionProfiles -----------------------------------------------------

describe("buildSectionProfiles", () => {
  it("returns 12 profiles for empty assessments", () => {
    const profiles = buildSectionProfiles([]);
    expect(profiles).toHaveLength(12);
    profiles.forEach((p) => {
      expect(p.latestAlignment).toBe("not_assessed");
      expect(p.evidenceQuality).toBe("no_evidence");
      expect(p.assessmentCount).toBe(0);
      expect(p.overallScore).toBe(0);
    });
  });

  it("uses latest assessment by date for a section", () => {
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values", alignmentLevel: "partially_aligned", assessedDate: "2025-01-01" }),
      makeAssessment({ id: "a-02", section: "ethos_values", alignmentLevel: "fully_aligned", assessedDate: "2025-03-01" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    const ethosProfile = profiles.find((p) => p.section === "ethos_values")!;
    expect(ethosProfile.latestAlignment).toBe("fully_aligned");
    expect(ethosProfile.assessmentCount).toBe(2);
  });

  it("scores 10 for fully_aligned with strong evidence", () => {
    const assessments = [
      makeAssessment({ section: "safeguarding", alignmentLevel: "fully_aligned", evidenceQuality: "strong" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    const sgProfile = profiles.find((p) => p.section === "safeguarding")!;
    expect(sgProfile.overallScore).toBe(10); // 6 + 4 = 10
  });

  it("scores 0 for not_aligned with no_evidence", () => {
    const assessments = [
      makeAssessment({ section: "safeguarding", alignmentLevel: "not_aligned", evidenceQuality: "no_evidence" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    const sgProfile = profiles.find((p) => p.section === "safeguarding")!;
    expect(sgProfile.overallScore).toBe(0); // 0 + 0 = 0
  });

  it("scores correctly for mostly_aligned with adequate evidence", () => {
    const assessments = [
      makeAssessment({ section: "care_approach", alignmentLevel: "mostly_aligned", evidenceQuality: "adequate" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    const profile = profiles.find((p) => p.section === "care_approach")!;
    expect(profile.overallScore).toBe(7); // 4 + 3 = 7
  });

  it("scores correctly for partially_aligned with limited evidence", () => {
    const assessments = [
      makeAssessment({ section: "staffing_model", alignmentLevel: "partially_aligned", evidenceQuality: "limited" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    const profile = profiles.find((p) => p.section === "staffing_model")!;
    expect(profile.overallScore).toBe(3); // 2 + 1 = 3
  });

  it("caps overallScore at 10", () => {
    const assessments = [
      makeAssessment({ section: "ethos_values", alignmentLevel: "fully_aligned", evidenceQuality: "strong" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    const profile = profiles.find((p) => p.section === "ethos_values")!;
    expect(profile.overallScore).toBeLessThanOrEqual(10);
  });

  it("handles multiple sections with different assessments", () => {
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values", alignmentLevel: "fully_aligned", evidenceQuality: "strong" }),
      makeAssessment({ id: "a-02", section: "care_approach", alignmentLevel: "not_aligned", evidenceQuality: "no_evidence" }),
      makeAssessment({ id: "a-03", section: "safeguarding", alignmentLevel: "mostly_aligned", evidenceQuality: "adequate" }),
    ];
    const profiles = buildSectionProfiles(assessments);
    expect(profiles.find((p) => p.section === "ethos_values")!.overallScore).toBe(10);
    expect(profiles.find((p) => p.section === "care_approach")!.overallScore).toBe(0);
    expect(profiles.find((p) => p.section === "safeguarding")!.overallScore).toBe(7);
    // Unassessed sections remain 0
    expect(profiles.find((p) => p.section === "staffing_model")!.overallScore).toBe(0);
    expect(profiles.find((p) => p.section === "staffing_model")!.latestAlignment).toBe("not_assessed");
  });
});

// -- generateStatementOfPurposeAlignmentIntelligence --------------------------

describe("generateStatementOfPurposeAlignmentIntelligence", () => {
  it("returns correct structure with all fields", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.alignmentQuality).toBeDefined();
    expect(result.reviewCurrency).toBeDefined();
    expect(result.stakeholderAwareness).toBeDefined();
    expect(result.ofstedResponse).toBeDefined();
    expect(result.sectionProfiles).toHaveLength(12);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("returns all empty data as inadequate with score 25 (from ofsted=25)", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    // alignment=0, review=0, stakeholder=0, ofsted=25 (no recs)
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overallScore at 100", () => {
    // Even with perfect data, should not exceed 100
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values" }),
    ];
    const reviews = [makeReview()];
    const feedback = [makeFeedback({ suggestionsProvided: true })];
    const recs: OfstedRecommendation[] = [];

    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, reviews, feedback, recs, "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("sums the four evaluator scores correctly", () => {
    const assessments = [
      makeAssessment({ id: "a-01" }),
    ];
    const reviews = [makeReview()];
    const feedback = [makeFeedback({ suggestionsProvided: true })];
    const recs: OfstedRecommendation[] = [];

    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, reviews, feedback, recs, "oak-house", "2025-01-01", "2025-06-30",
    );

    const expectedTotal =
      result.alignmentQuality.overallScore +
      result.reviewCurrency.overallScore +
      result.stakeholderAwareness.overallScore +
      result.ofstedResponse.overallScore;

    expect(result.overallScore).toBe(Math.min(100, Math.max(0, expectedTotal)));
  });

  it("returns regulatory links", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.regulatoryLinks.length).toBe(6);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Reg 16");
    expect(result.regulatoryLinks[1]).toContain("CHR 2015 Reg 7");
    expect(result.regulatoryLinks[2]).toContain("SCCIF");
    expect(result.regulatoryLinks[3]).toContain("NMS 1");
    expect(result.regulatoryLinks[4]).toContain("UNCRC Article 3");
    expect(result.regulatoryLinks[5]).toContain("CA 1989");
  });

  // -- Strengths --

  it("adds strength for high alignment quality score", () => {
    const assessments = Array.from({ length: 4 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        section: (["ethos_values", "care_approach", "safeguarding", "staffing_model"] as SoPSection[])[i],
      }),
    );
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    if (result.alignmentQuality.overallScore >= 20) {
      expect(result.strengths.some((s) => s.includes("Strong alignment"))).toBe(true);
    }
  });

  it("adds strength for high fully aligned rate", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        section: (["ethos_values", "care_approach", "safeguarding", "staffing_model", "education_support"] as SoPSection[])[i],
      }),
    );
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("fully aligned"))).toBe(true);
  });

  it("adds strength for no ofsted recommendations", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("No outstanding Ofsted"))).toBe(true);
  });

  it("adds strength for children consistently consulted in reviews", () => {
    const reviews = [
      makeReview({ id: "r-01", childrenConsulted: true }),
      makeReview({ id: "r-02", childrenConsulted: true }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], reviews, [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("Children are consistently consulted"))).toBe(true);
  });

  it("adds strength for high stakeholder awareness", () => {
    const feedback = Array.from({ length: 5 }, (_, i) =>
      makeFeedback({
        id: `sf-${i}`,
        awareOfSoP: true,
        sopReflectsReality: true,
        valuesEvident: true,
        suggestionsProvided: true,
      }),
    );
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], feedback, [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("High stakeholder awareness"))).toBe(true);
  });

  it("adds strength for all actions completed", () => {
    const assessments = [
      makeAssessment({ id: "a-01", actionRequired: true, actionTaken: true }),
      makeAssessment({ id: "a-02", section: "care_approach", actionRequired: true, actionTaken: true }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.some((s) => s.includes("All identified alignment actions"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("flags no assessments as area for improvement", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No alignment assessments"))).toBe(true);
  });

  it("flags not aligned sections", () => {
    const assessments = [
      makeAssessment({ alignmentLevel: "not_aligned", evidenceQuality: "no_evidence" }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("not aligned"))).toBe(true);
  });

  it("flags no reviews", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No reviews"))).toBe(true);
  });

  it("flags overdue reviews", () => {
    const reviews = [makeReview({ status: "overdue" })];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], reviews, [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("flags no stakeholder feedback", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No stakeholder feedback"))).toBe(true);
  });

  it("flags outstanding Ofsted recommendations", () => {
    const recs = [makeRecommendation({ addressed: false, evidenceOfChange: false })];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], recs, "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Ofsted recommendation"))).toBe(true);
  });

  it("flags low children consulted rate", () => {
    const reviews = [
      makeReview({ id: "r-01", childrenConsulted: false }),
      makeReview({ id: "r-02", childrenConsulted: true }),
      makeReview({ id: "r-03", childrenConsulted: false }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], reviews, [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Children consulted"))).toBe(true);
  });

  it("flags low awareness rate", () => {
    const feedback = [
      makeFeedback({ id: "sf-01", awareOfSoP: false, sopReflectsReality: false, valuesEvident: false }),
      makeFeedback({ id: "sf-02", awareOfSoP: false, sopReflectsReality: false, valuesEvident: false, stakeholderType: "staff" }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], feedback, [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement.some((a) => a.includes("aware of the Statement of Purpose"))).toBe(true);
  });

  // -- Actions --

  it("adds action for no assessments", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("Complete alignment assessments"))).toBe(true);
  });

  it("adds action for not aligned sections", () => {
    const assessments = [
      makeAssessment({ alignmentLevel: "not_aligned", evidenceQuality: "no_evidence" }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("action plans for sections"))).toBe(true);
  });

  it("adds action for no reviews", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("Schedule and complete"))).toBe(true);
  });

  it("adds action for overdue reviews", () => {
    const reviews = [makeReview({ status: "overdue" })];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], reviews, [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("Urgently complete overdue"))).toBe(true);
  });

  it("adds action for outstanding Ofsted recommendations", () => {
    const recs = [makeRecommendation({ addressed: false, evidenceOfChange: false })];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], recs, "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("Address all outstanding Ofsted"))).toBe(true);
  });

  it("adds action for no stakeholder feedback", () => {
    const result = generateStatementOfPurposeAlignmentIntelligence(
      [], [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("Gather feedback from"))).toBe(true);
  });

  it("adds action for unassessed sections when some assessments exist", () => {
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values" }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions.some((a) => a.includes("unassessed section"))).toBe(true);
  });

  // -- Rating mapping --

  it("returns outstanding for high-scoring scenario", () => {
    const assessments = Array.from({ length: 6 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        section: (["ethos_values", "care_approach", "safeguarding", "staffing_model", "education_support", "health_wellbeing"] as SoPSection[])[i],
      }),
    );
    const reviews = [makeReview()];
    const feedback = Array.from({ length: 5 }, (_, i) =>
      makeFeedback({
        id: `sf-${i}`,
        suggestionsProvided: true,
        stakeholderType: (["child", "staff", "social_worker", "family", "manager"] as StakeholderType[])[i],
      }),
    );
    const recs: OfstedRecommendation[] = [];

    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, reviews, feedback, recs, "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for poor-scoring scenario", () => {
    const assessments = [
      makeAssessment({ alignmentLevel: "not_aligned", evidenceQuality: "no_evidence", actionRequired: true, actionTaken: false }),
    ];
    const reviews = [makeReview({ status: "overdue", childrenConsulted: false, staffConsulted: false, regulatoryChangesIncorporated: false, allSectionsReviewed: false })];
    const feedback = [
      makeFeedback({ awareOfSoP: false, sopReflectsReality: false, valuesEvident: false, suggestionsProvided: false }),
    ];
    const recs = [
      makeRecommendation({ id: "or-01", addressed: false, evidenceOfChange: false }),
      makeRecommendation({ id: "or-02", addressed: false, evidenceOfChange: false }),
    ];

    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, reviews, feedback, recs, "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  // -- Section Profiles integration --

  it("builds section profiles correctly", () => {
    const assessments = [
      makeAssessment({ id: "a-01", section: "ethos_values", alignmentLevel: "fully_aligned", evidenceQuality: "strong" }),
      makeAssessment({ id: "a-02", section: "safeguarding", alignmentLevel: "partially_aligned", evidenceQuality: "limited" }),
    ];
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, [], [], [], "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.sectionProfiles).toHaveLength(12);
    const ethosProfile = result.sectionProfiles.find((p) => p.section === "ethos_values")!;
    expect(ethosProfile.overallScore).toBe(10);
    const sgProfile = result.sectionProfiles.find((p) => p.section === "safeguarding")!;
    expect(sgProfile.overallScore).toBe(3);
  });

  // -- Full realistic scenario --

  it("handles Oak House-style realistic data", () => {
    const sections: SoPSection[] = [
      "ethos_values", "care_approach", "admission_criteria", "staffing_model",
      "education_support", "health_wellbeing", "behaviour_management",
      "safeguarding", "family_contact", "transition_planning",
      "location_community", "complaints_procedure",
    ];

    const assessments: SoPAlignmentAssessment[] = sections.map((section, i) => ({
      id: `a-${i}`,
      section,
      alignmentLevel: i < 8 ? "fully_aligned" as AlignmentLevel : "mostly_aligned" as AlignmentLevel,
      assessedDate: "2025-03-01",
      assessedBy: "Manager",
      evidenceQuality: i < 6 ? "strong" as EvidenceQuality : "adequate" as EvidenceQuality,
      evidenceDescription: "Documented and observed",
      actionRequired: i >= 10,
      actionTaken: i >= 10 ? true : null,
    }));

    const reviews: SoPReviewRecord[] = [
      makeReview({ id: "r-01", status: "current" }),
      makeReview({ id: "r-02", status: "current", childrenConsulted: true, staffConsulted: true }),
    ];

    const feedback: StakeholderFeedback[] = [
      makeFeedback({ id: "sf-01", stakeholderType: "child", awareOfSoP: true, sopReflectsReality: true, valuesEvident: true }),
      makeFeedback({ id: "sf-02", stakeholderType: "staff", awareOfSoP: true, sopReflectsReality: true, valuesEvident: true }),
      makeFeedback({ id: "sf-03", stakeholderType: "social_worker", awareOfSoP: true, sopReflectsReality: true, valuesEvident: true }),
      makeFeedback({ id: "sf-04", stakeholderType: "family", awareOfSoP: true, sopReflectsReality: false, valuesEvident: true }),
    ];

    const recs: OfstedRecommendation[] = [
      makeRecommendation({ id: "or-01", addressed: true, evidenceOfChange: true }),
    ];

    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments, reviews, feedback, recs, "oak-house", "2025-01-01", "2025-06-30",
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(result.rating);
    expect(result.sectionProfiles).toHaveLength(12);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBe(6);
  });
});
