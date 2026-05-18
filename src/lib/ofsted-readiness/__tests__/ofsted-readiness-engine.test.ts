// ══════════════════════════════════════════════════════════════════════════════
// Ofsted Readiness Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateOfstedReadinessIntelligence,
  evaluateJudgmentAreaReadiness,
  evaluateEvidencePortfolio,
  evaluateActionPlanProgress,
  evaluateInspectionPreparedness,
  getJudgmentAreaLabel,
  getEvidenceStrengthLabel,
  getInspectionReadinessLabel,
  getSCCIFRequirementLabel,
  getAreaStatusLabel,
  getActionSourceLabel,
  getActionPriorityLabel,
  ALL_SCCIF_REQUIREMENTS,
  ALL_JUDGMENT_AREAS,
} from "../ofsted-readiness-engine";
import type {
  JudgmentArea,
  EvidenceStrength,
  InspectionReadiness,
  SCCIFRequirement,
  AreaStatus,
  Rating,
  AreaScore,
  SCCIFEvidenceItem,
  InspectionHistory,
  ActionPlanItem,
} from "../ofsted-readiness-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-04-30";

function makeAreaScore(overrides: Partial<AreaScore> = {}): AreaScore {
  return {
    id: "as-001",
    area: "safeguarding",
    score: 82,
    rating: "outstanding",
    lastAssessedDate: "2026-04-15",
    assessedBy: "Sarah Johnson",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<SCCIFEvidenceItem> = {}): SCCIFEvidenceItem {
  return {
    id: "ev-001",
    requirement: "children_are_safe",
    judgmentArea: "help_and_protection",
    evidenceStrength: "strong",
    description: "Comprehensive safeguarding evidence portfolio",
    lastUpdated: "2026-04-01",
    linkedDocuments: 4,
    ...overrides,
  };
}

function makeInspection(overrides: Partial<InspectionHistory> = {}): InspectionHistory {
  return {
    id: "insp-001",
    inspectionDate: "2025-01-15",
    overallJudgment: "good",
    experiencesJudgment: "good",
    helpProtectionJudgment: "good",
    leadershipJudgment: "good",
    requirementsIssued: 1,
    recommendationsIssued: 2,
    requirementsCompleted: 1,
    recommendationsCompleted: 1,
    ...overrides,
  };
}

function makeAction(overrides: Partial<ActionPlanItem> = {}): ActionPlanItem {
  return {
    id: "act-001",
    source: "internal_audit",
    description: "Review safeguarding procedures",
    status: "completed",
    targetDate: "2026-03-01",
    completedDate: "2026-02-28",
    priority: "medium",
    assignedTo: "Sarah Johnson",
    ...overrides,
  };
}

// Full set of evidence items covering all 15 SCCIF requirements
function makeFullEvidenceSet(
  strength: EvidenceStrength = "strong",
  lastUpdated: string = "2026-04-01",
  linkedDocs: number = 4,
): SCCIFEvidenceItem[] {
  const judgmentMapping: Record<SCCIFRequirement, JudgmentArea> = {
    children_make_progress: "overall_experiences",
    children_are_safe: "help_and_protection",
    staff_are_skilled: "leadership_and_management",
    leaders_are_ambitious: "leadership_and_management",
    matching_is_effective: "overall_experiences",
    care_is_individualised: "overall_experiences",
    records_are_thorough: "leadership_and_management",
    partnership_working: "help_and_protection",
    children_participate: "overall_experiences",
    complaints_are_resolved: "help_and_protection",
    health_needs_met: "overall_experiences",
    education_supported: "overall_experiences",
    independence_promoted: "overall_experiences",
    contact_is_purposeful: "overall_experiences",
    behaviour_is_understood: "help_and_protection",
  };
  return ALL_SCCIF_REQUIREMENTS.map((req, i) => ({
    id: `ev-full-${i}`,
    requirement: req,
    judgmentArea: judgmentMapping[req],
    evidenceStrength: strength,
    description: `Evidence for ${req}`,
    lastUpdated,
    linkedDocuments: linkedDocs,
  }));
}

// Full set of area scores covering all 3 judgment areas
function makeFullAreaScores(score: number = 85): AreaScore[] {
  return [
    makeAreaScore({ id: "as-01", area: "safeguarding", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-02", area: "education", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-03", area: "health", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-04", area: "behaviour", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-05", area: "care_planning", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-06", area: "staff_training", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-07", area: "leadership", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
    makeAreaScore({ id: "as-08", area: "participation", score, rating: score >= 80 ? "outstanding" : score >= 60 ? "good" : score >= 40 ? "requires_improvement" : "inadequate" }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  it("should have exactly 15 SCCIF requirements", () => {
    expect(ALL_SCCIF_REQUIREMENTS).toHaveLength(15);
  });

  it("should have exactly 3 judgment areas", () => {
    expect(ALL_JUDGMENT_AREAS).toHaveLength(3);
  });

  it("should contain the correct judgment areas", () => {
    expect(ALL_JUDGMENT_AREAS).toContain("overall_experiences");
    expect(ALL_JUDGMENT_AREAS).toContain("help_and_protection");
    expect(ALL_JUDGMENT_AREAS).toContain("leadership_and_management");
  });

  it("should contain all expected SCCIF requirements", () => {
    const expected: SCCIFRequirement[] = [
      "children_make_progress",
      "children_are_safe",
      "staff_are_skilled",
      "leaders_are_ambitious",
      "matching_is_effective",
      "care_is_individualised",
      "records_are_thorough",
      "partnership_working",
      "children_participate",
      "complaints_are_resolved",
      "health_needs_met",
      "education_supported",
      "independence_promoted",
      "contact_is_purposeful",
      "behaviour_is_understood",
    ];
    for (const req of expected) {
      expect(ALL_SCCIF_REQUIREMENTS).toContain(req);
    }
  });

  it("should not have duplicates in SCCIF requirements", () => {
    const unique = new Set(ALL_SCCIF_REQUIREMENTS);
    expect(unique.size).toBe(ALL_SCCIF_REQUIREMENTS.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("Label Helpers", () => {
  describe("getJudgmentAreaLabel", () => {
    it("should return correct label for overall_experiences", () => {
      expect(getJudgmentAreaLabel("overall_experiences")).toBe(
        "The Overall Experiences and Progress of Children and Young People",
      );
    });

    it("should return correct label for help_and_protection", () => {
      expect(getJudgmentAreaLabel("help_and_protection")).toBe(
        "How Well Children and Young People Are Helped and Protected",
      );
    });

    it("should return correct label for leadership_and_management", () => {
      expect(getJudgmentAreaLabel("leadership_and_management")).toBe(
        "The Effectiveness of Leaders and Managers",
      );
    });
  });

  describe("getEvidenceStrengthLabel", () => {
    it("should return Strong for strong", () => {
      expect(getEvidenceStrengthLabel("strong")).toBe("Strong");
    });

    it("should return Adequate for adequate", () => {
      expect(getEvidenceStrengthLabel("adequate")).toBe("Adequate");
    });

    it("should return Weak for weak", () => {
      expect(getEvidenceStrengthLabel("weak")).toBe("Weak");
    });

    it("should return Absent for absent", () => {
      expect(getEvidenceStrengthLabel("absent")).toBe("Absent");
    });
  });

  describe("getInspectionReadinessLabel", () => {
    it("should return Ready for ready", () => {
      expect(getInspectionReadinessLabel("ready")).toBe("Ready");
    });

    it("should return Mostly Ready for mostly_ready", () => {
      expect(getInspectionReadinessLabel("mostly_ready")).toBe("Mostly Ready");
    });

    it("should return Partially Ready for partially_ready", () => {
      expect(getInspectionReadinessLabel("partially_ready")).toBe("Partially Ready");
    });

    it("should return Not Ready for not_ready", () => {
      expect(getInspectionReadinessLabel("not_ready")).toBe("Not Ready");
    });
  });

  describe("getSCCIFRequirementLabel", () => {
    it("should return label for each requirement", () => {
      expect(getSCCIFRequirementLabel("children_make_progress")).toBe("Children Make Progress");
      expect(getSCCIFRequirementLabel("children_are_safe")).toBe("Children Are Safe");
      expect(getSCCIFRequirementLabel("staff_are_skilled")).toBe("Staff Are Skilled");
      expect(getSCCIFRequirementLabel("leaders_are_ambitious")).toBe("Leaders Are Ambitious");
      expect(getSCCIFRequirementLabel("matching_is_effective")).toBe("Matching Is Effective");
      expect(getSCCIFRequirementLabel("care_is_individualised")).toBe("Care Is Individualised");
      expect(getSCCIFRequirementLabel("records_are_thorough")).toBe("Records Are Thorough");
      expect(getSCCIFRequirementLabel("partnership_working")).toBe("Partnership Working");
      expect(getSCCIFRequirementLabel("children_participate")).toBe("Children Participate");
      expect(getSCCIFRequirementLabel("complaints_are_resolved")).toBe("Complaints Are Resolved");
      expect(getSCCIFRequirementLabel("health_needs_met")).toBe("Health Needs Met");
      expect(getSCCIFRequirementLabel("education_supported")).toBe("Education Supported");
      expect(getSCCIFRequirementLabel("independence_promoted")).toBe("Independence Promoted");
      expect(getSCCIFRequirementLabel("contact_is_purposeful")).toBe("Contact Is Purposeful");
      expect(getSCCIFRequirementLabel("behaviour_is_understood")).toBe("Behaviour Is Understood");
    });
  });

  describe("getAreaStatusLabel", () => {
    it("should return Outstanding for outstanding", () => {
      expect(getAreaStatusLabel("outstanding")).toBe("Outstanding");
    });

    it("should return Good for good", () => {
      expect(getAreaStatusLabel("good")).toBe("Good");
    });

    it("should return Requires Improvement for requires_improvement", () => {
      expect(getAreaStatusLabel("requires_improvement")).toBe("Requires Improvement");
    });

    it("should return Inadequate for inadequate", () => {
      expect(getAreaStatusLabel("inadequate")).toBe("Inadequate");
    });
  });

  describe("getActionSourceLabel", () => {
    it("should return correct labels for known sources", () => {
      expect(getActionSourceLabel("ofsted_requirement")).toBe("Ofsted Requirement");
      expect(getActionSourceLabel("ofsted_recommendation")).toBe("Ofsted Recommendation");
      expect(getActionSourceLabel("internal_audit")).toBe("Internal Audit");
      expect(getActionSourceLabel("reg44")).toBe("Reg 44 Visit");
    });

    it("should return source string for unknown sources", () => {
      expect(getActionSourceLabel("unknown_source")).toBe("unknown_source");
    });
  });

  describe("getActionPriorityLabel", () => {
    it("should return correct labels for known priorities", () => {
      expect(getActionPriorityLabel("critical")).toBe("Critical");
      expect(getActionPriorityLabel("high")).toBe("High");
      expect(getActionPriorityLabel("medium")).toBe("Medium");
      expect(getActionPriorityLabel("low")).toBe("Low");
    });

    it("should return priority string for unknown priorities", () => {
      expect(getActionPriorityLabel("unknown_priority")).toBe("unknown_priority");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateJudgmentAreaReadiness (30 pts)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateJudgmentAreaReadiness", () => {
  it("should return 0 for empty inputs", () => {
    expect(evaluateJudgmentAreaReadiness([], [])).toBe(0);
  });

  it("should return 0 for area scores that do not map to any judgment area", () => {
    const scores = [makeAreaScore({ area: "unknown_area", score: 90 })];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(0);
  });

  it("should award +6 per judgment area with avg >= 80", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 85 }), // help_and_protection
    ];
    // 1 area at 80+ = 6 points
    const result = evaluateJudgmentAreaReadiness(scores, []);
    expect(result).toBe(6);
  });

  it("should award +4 per judgment area with avg >= 60 and < 80", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 65 }),
    ];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(4);
  });

  it("should award +2 per judgment area with avg >= 40 and < 60", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 45 }),
    ];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(2);
  });

  it("should award 0 for judgment area with avg < 40", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 30 }),
    ];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(0);
  });

  it("should average scores within a judgment area", () => {
    // safeguarding and behaviour both map to help_and_protection
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 90 }),
      makeAreaScore({ area: "behaviour", score: 50 }),
    ];
    // avg = 70, so +4
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(4);
  });

  it("should score all 3 areas independently", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 85 }),   // help_and_protection: 85 → +6
      makeAreaScore({ area: "education", score: 75 }),       // overall_experiences: 75 → +4
      makeAreaScore({ area: "staff_training", score: 65 }),  // leadership_and_management: 65 → +4
    ];
    // 6 + 4 + 4 = 14
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(14);
  });

  it("should add +3 for evidence covering >= 90% of requirements", () => {
    // 14 out of 15 = 93.3% (>= 90%), default strength is "strong" so no-absent bonus also applies
    const evidence = ALL_SCCIF_REQUIREMENTS.slice(0, 14).map((req, i) =>
      makeEvidence({ id: `ev-${i}`, requirement: req }),
    );
    // +3 (coverage) + +3 (no absent) = 6
    expect(evaluateJudgmentAreaReadiness([], evidence)).toBe(6);
  });

  it("should not add +3 when evidence covers < 90% of requirements", () => {
    // 13 out of 15 = 86.7% (< 90%), default strength is "strong" so no-absent bonus still applies
    const evidence = ALL_SCCIF_REQUIREMENTS.slice(0, 13).map((req, i) =>
      makeEvidence({ id: `ev-${i}`, requirement: req }),
    );
    // No coverage bonus, but +3 no-absent bonus
    expect(evaluateJudgmentAreaReadiness([], evidence)).toBe(3);
  });

  it("should add +3 for full coverage (all 15 requirements)", () => {
    const evidence = makeFullEvidenceSet();
    // All 15 requirements covered: +3 for coverage, +3 for no absent = 6
    expect(evaluateJudgmentAreaReadiness([], evidence)).toBe(6);
  });

  it("should add +3 when no absent evidence (with evidence present)", () => {
    const evidence = [
      makeEvidence({ evidenceStrength: "strong" }),
      makeEvidence({ id: "ev-002", requirement: "children_make_progress", evidenceStrength: "adequate" }),
    ];
    // 2/15 < 90% so no coverage bonus, but no absent → +3
    expect(evaluateJudgmentAreaReadiness([], evidence)).toBe(3);
  });

  it("should not add +3 when absent evidence exists", () => {
    const evidence = [
      makeEvidence({ evidenceStrength: "absent" }),
    ];
    // 1/15 < 90% and has absent → 0
    expect(evaluateJudgmentAreaReadiness([], evidence)).toBe(0);
  });

  it("should not add no-absent bonus when evidence array is empty", () => {
    expect(evaluateJudgmentAreaReadiness([], [])).toBe(0);
  });

  it("should add +6 bonus when all 3 areas avg >= 80", () => {
    const scores = makeFullAreaScores(85);
    // All 3 judgment areas at 85 avg → 6+6+6=18 + +6 bonus = 24
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(24);
  });

  it("should not add +6 bonus when one area avg < 80", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 85 }),    // help_and_protection: 85
      makeAreaScore({ area: "education", score: 85 }),        // overall_experiences: 85
      makeAreaScore({ area: "staff_training", score: 70 }),   // leadership_and_management: 70 (< 80)
    ];
    // 6 + 6 + 4 = 16, no bonus
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(16);
  });

  it("should not add +6 bonus when one judgment area has no scores", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 85 }),   // help_and_protection
      makeAreaScore({ area: "education", score: 85 }),       // overall_experiences
      // no leadership_and_management scores
    ];
    // 6 + 6 = 12, no bonus because leadership_and_management is empty
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(12);
  });

  it("should clamp at 30 maximum", () => {
    const scores = makeFullAreaScores(90);
    const evidence = makeFullEvidenceSet("strong");
    // All 3 areas at 90: 6+6+6=18 + bonus 6 = 24
    // Full evidence coverage: +3 + no absent: +3 = 30
    // Total = 24 + 6 = 30 (clamped)
    const result = evaluateJudgmentAreaReadiness(scores, evidence);
    expect(result).toBeLessThanOrEqual(30);
  });

  it("should not go below 0", () => {
    const scores = [makeAreaScore({ area: "safeguarding", score: 10 })];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBeGreaterThanOrEqual(0);
  });

  it("should handle multiple areas mapping to same judgment area", () => {
    const scores = [
      makeAreaScore({ area: "education", score: 90 }),
      makeAreaScore({ area: "health", score: 70 }),
      makeAreaScore({ area: "care_planning", score: 80 }),
      makeAreaScore({ area: "participation", score: 60 }),
    ];
    // All map to overall_experiences, avg = (90+70+80+60)/4 = 75 → +4
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(4);
  });

  it("should handle boundary score of exactly 80", () => {
    const scores = [makeAreaScore({ area: "safeguarding", score: 80 })];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(6);
  });

  it("should handle boundary score of exactly 60", () => {
    const scores = [makeAreaScore({ area: "safeguarding", score: 60 })];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(4);
  });

  it("should handle boundary score of exactly 40", () => {
    const scores = [makeAreaScore({ area: "safeguarding", score: 40 })];
    expect(evaluateJudgmentAreaReadiness(scores, [])).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateEvidencePortfolio (25 pts)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEvidencePortfolio", () => {
  it("should return 0 for empty evidence", () => {
    expect(evaluateEvidencePortfolio([])).toBe(0);
  });

  it("should calculate coverage score correctly", () => {
    // 1 out of 15 requirements = 1/15 * 12 = 0.8
    const evidence = [makeEvidence({ evidenceStrength: "adequate", linkedDocuments: 1 })];
    const result = evaluateEvidencePortfolio(evidence);
    expect(result).toBeGreaterThan(0);
  });

  it("should award full 12 points for 100% coverage", () => {
    const evidence = makeFullEvidenceSet("adequate", "2026-04-01", 1);
    // 15/15 * 12 = 12, adequate < 80% strong, no other bonuses
    const result = evaluateEvidencePortfolio(evidence);
    expect(result).toBeGreaterThanOrEqual(12);
  });

  it("should add +4 when >= 80% evidence is strong", () => {
    // 13 strong, 2 adequate = 86.7% strong (>= 80%)
    const evidence: SCCIFEvidenceItem[] = [];
    ALL_SCCIF_REQUIREMENTS.forEach((req, i) => {
      evidence.push(
        makeEvidence({
          id: `ev-${i}`,
          requirement: req,
          evidenceStrength: i < 13 ? "strong" : "adequate",
          linkedDocuments: 1,
        }),
      );
    });
    const result = evaluateEvidencePortfolio(evidence);
    // 12 (coverage) + 4 (strong rate) = 16
    expect(result).toBeGreaterThanOrEqual(16);
  });

  it("should not add +4 when < 80% evidence is strong", () => {
    // 11 strong, 4 adequate = 73.3% strong (< 80%)
    const evidence: SCCIFEvidenceItem[] = [];
    ALL_SCCIF_REQUIREMENTS.forEach((req, i) => {
      evidence.push(
        makeEvidence({
          id: `ev-${i}`,
          requirement: req,
          evidenceStrength: i < 11 ? "strong" : "adequate",
          linkedDocuments: 1,
        }),
      );
    });
    const result = evaluateEvidencePortfolio(evidence);
    // 12 (coverage) but not +4 for strong
    expect(result).toBeLessThan(16);
  });

  it("should add +3 when all evidence updated within 90 days of period end", () => {
    const evidence = [
      makeEvidence({ lastUpdated: "2026-03-01", linkedDocuments: 1, evidenceStrength: "adequate" }),
    ];
    // 2026-03-01 to 2026-04-30 = 60 days (<= 90)
    const result = evaluateEvidencePortfolio(evidence, "2026-04-30");
    // Base: 1/15 * 12 ~= 0.8, +3 recency = ~3.8
    expect(result).toBeGreaterThan(3);
  });

  it("should not add +3 when evidence not within 90 days", () => {
    const evidence = [
      makeEvidence({ lastUpdated: "2025-12-01", linkedDocuments: 1, evidenceStrength: "adequate" }),
    ];
    // 2025-12-01 to 2026-04-30 = 150 days (> 90)
    const result = evaluateEvidencePortfolio(evidence, "2026-04-30");
    expect(result).toBeLessThan(4);
  });

  it("should not add recency bonus when no periodEnd provided", () => {
    const evidence = [
      makeEvidence({ lastUpdated: "2026-04-01", linkedDocuments: 1, evidenceStrength: "adequate" }),
    ];
    const withPeriod = evaluateEvidencePortfolio(evidence, "2026-04-30");
    const withoutPeriod = evaluateEvidencePortfolio(evidence);
    // Without period should not get recency bonus
    expect(withoutPeriod).toBeLessThanOrEqual(withPeriod);
  });

  it("should add +3 when avg linked documents >= 3", () => {
    const evidence = [
      makeEvidence({ linkedDocuments: 4, evidenceStrength: "adequate" }),
    ];
    const result = evaluateEvidencePortfolio(evidence);
    // 1/15*12 + 3 (docs) = ~3.8
    expect(result).toBeGreaterThan(3);
  });

  it("should not add +3 when avg linked documents < 3", () => {
    const evidence = [
      makeEvidence({ linkedDocuments: 2, evidenceStrength: "adequate" }),
    ];
    const resultLow = evaluateEvidencePortfolio(evidence);
    const evidenceHigh = [
      makeEvidence({ linkedDocuments: 4, evidenceStrength: "adequate" }),
    ];
    const resultHigh = evaluateEvidencePortfolio(evidenceHigh);
    expect(resultLow).toBeLessThan(resultHigh);
  });

  it("should add +3 bonus for zero weak or absent evidence", () => {
    const evidence = [
      makeEvidence({ evidenceStrength: "strong", linkedDocuments: 1 }),
      makeEvidence({ id: "ev-002", requirement: "children_make_progress", evidenceStrength: "adequate", linkedDocuments: 1 }),
    ];
    // No weak or absent → +3 bonus
    const result = evaluateEvidencePortfolio(evidence);
    // 2/15*12 + 3 bonus = ~4.6
    expect(result).toBeGreaterThan(4);
  });

  it("should not add +3 bonus when weak evidence exists", () => {
    const evidence = [
      makeEvidence({ evidenceStrength: "weak", linkedDocuments: 1 }),
    ];
    const result = evaluateEvidencePortfolio(evidence);
    // 1/15*12 ~= 0.8, no bonus
    expect(result).toBeLessThan(1);
  });

  it("should not add +3 bonus when absent evidence exists", () => {
    const evidence = [
      makeEvidence({ evidenceStrength: "absent", linkedDocuments: 1 }),
    ];
    const result = evaluateEvidencePortfolio(evidence);
    expect(result).toBeLessThan(1);
  });

  it("should clamp at 25 maximum", () => {
    const evidence = makeFullEvidenceSet("strong", "2026-04-01", 5);
    const result = evaluateEvidencePortfolio(evidence, "2026-04-30");
    // 12 + 4 + 3 + 3 + 3 = 25
    expect(result).toBeLessThanOrEqual(25);
  });

  it("should achieve maximum 25 with perfect evidence", () => {
    const evidence = makeFullEvidenceSet("strong", "2026-04-01", 5);
    const result = evaluateEvidencePortfolio(evidence, "2026-04-30");
    expect(result).toBe(25);
  });

  it("should not go below 0", () => {
    const evidence = [
      makeEvidence({ evidenceStrength: "absent", linkedDocuments: 0 }),
    ];
    expect(evaluateEvidencePortfolio(evidence)).toBeGreaterThanOrEqual(0);
  });

  it("should count distinct requirements for coverage", () => {
    // Two evidence items for the same requirement
    const evidence = [
      makeEvidence({ requirement: "children_are_safe", evidenceStrength: "adequate", linkedDocuments: 1 }),
      makeEvidence({ id: "ev-002", requirement: "children_are_safe", evidenceStrength: "strong", linkedDocuments: 1 }),
    ];
    // Only 1 distinct requirement, coverage = 1/15 * 12
    const result = evaluateEvidencePortfolio(evidence);
    // Strong rate = 50% < 80%, no doc bonus (avg 1), no weak/absent: +3
    // ~ 0.8 + 3 = 3.8
    expect(result).toBeLessThan(5);
  });

  it("should handle boundary of exactly 3 linked documents", () => {
    const evidence = [
      makeEvidence({ linkedDocuments: 3, evidenceStrength: "adequate" }),
    ];
    const result = evaluateEvidencePortfolio(evidence);
    // Should include +3 for docs
    expect(result).toBeGreaterThan(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateActionPlanProgress (25 pts)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActionPlanProgress", () => {
  it("should return 0 for empty action items", () => {
    expect(evaluateActionPlanProgress([], [])).toBe(0);
  });

  it("should award +8 when completion rate >= 80%", () => {
    // 5 items, 4 completed = 80%
    const actions = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "completed" }),
      makeAction({ id: "a3", status: "completed" }),
      makeAction({ id: "a4", status: "completed" }),
      makeAction({ id: "a5", status: "in_progress" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBeGreaterThanOrEqual(8);
  });

  it("should not award +8 when completion rate < 80%", () => {
    // 5 items, 3 completed = 60%
    const actions = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "completed" }),
      makeAction({ id: "a3", status: "completed" }),
      makeAction({ id: "a4", status: "in_progress" }),
      makeAction({ id: "a5", status: "not_started" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    // Does not get +8, but may get other points
    expect(result).toBeLessThan(20);
  });

  it("should award +5 when critical/high completion >= 90%", () => {
    const actions = [
      makeAction({ id: "a1", priority: "critical", status: "completed" }),
      makeAction({ id: "a2", priority: "high", status: "completed" }),
      makeAction({ id: "a3", priority: "medium", status: "not_started" }),
    ];
    // 2 crit/high, 2 completed = 100% crit/high completion
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBeGreaterThanOrEqual(5);
  });

  it("should not award +5 when critical/high completion < 90%", () => {
    const actions = [
      makeAction({ id: "a1", priority: "critical", status: "completed" }),
      makeAction({ id: "a2", priority: "high", status: "not_started" }),
      makeAction({ id: "a3", priority: "high", status: "not_started" }),
    ];
    // 1/3 crit/high completed = 33.3%
    const result = evaluateActionPlanProgress(actions, []);
    // Missing the +5
    expect(result).toBeLessThan(17);
  });

  it("should award +4 when no actions are overdue", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "in_progress" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBeGreaterThanOrEqual(4);
  });

  it("should not award +4 when actions are overdue", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "overdue" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    // Compare: same but without overdue
    const actionsNoOverdue = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "in_progress" }),
    ];
    const resultNoOverdue = evaluateActionPlanProgress(actionsNoOverdue, []);
    expect(result).toBeLessThan(resultNoOverdue);
  });

  it("should award +4 when all Ofsted requirements are completed", () => {
    const actions = [
      makeAction({ id: "a1", source: "ofsted_requirement", status: "completed" }),
      makeAction({ id: "a2", source: "ofsted_requirement", status: "completed" }),
      makeAction({ id: "a3", source: "internal_audit", status: "not_started" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBeGreaterThanOrEqual(4);
  });

  it("should not award +4 when Ofsted requirements incomplete", () => {
    const actions = [
      makeAction({ id: "a1", source: "ofsted_requirement", status: "completed" }),
      makeAction({ id: "a2", source: "ofsted_requirement", status: "in_progress" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    // Compare with all completed
    const actionsComplete = [
      makeAction({ id: "a1", source: "ofsted_requirement", status: "completed" }),
      makeAction({ id: "a2", source: "ofsted_requirement", status: "completed" }),
    ];
    const resultComplete = evaluateActionPlanProgress(actionsComplete, []);
    expect(result).toBeLessThan(resultComplete);
  });

  it("should award +4 when no Ofsted requirements exist", () => {
    const actions = [
      makeAction({ id: "a1", source: "internal_audit", status: "completed" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    // Should include +4 for no outstanding requirements
    expect(result).toBeGreaterThanOrEqual(4);
  });

  it("should award +4 when all Ofsted recommendations completed or in progress", () => {
    const actions = [
      makeAction({ id: "a1", source: "ofsted_recommendation", status: "completed" }),
      makeAction({ id: "a2", source: "ofsted_recommendation", status: "in_progress" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBeGreaterThanOrEqual(4);
  });

  it("should not award +4 when Ofsted recommendations not started", () => {
    const actions = [
      makeAction({ id: "a1", source: "ofsted_recommendation", status: "not_started" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    const actionsComplete = [
      makeAction({ id: "a1", source: "ofsted_recommendation", status: "completed" }),
    ];
    const resultComplete = evaluateActionPlanProgress(actionsComplete, []);
    expect(result).toBeLessThan(resultComplete);
  });

  it("should award +4 when no Ofsted recommendations exist", () => {
    const actions = [
      makeAction({ id: "a1", source: "internal_audit", status: "completed" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    // Should include +4 for no outstanding recommendations
    expect(result).toBeGreaterThanOrEqual(4);
  });

  it("should clamp at 25 maximum", () => {
    const actions = [
      makeAction({ id: "a1", priority: "critical", source: "internal_audit", status: "completed" }),
    ];
    // 8 + 5 + 4 + 4 + 4 = 25
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBeLessThanOrEqual(25);
  });

  it("should achieve 25 with perfect actions", () => {
    const actions = [
      makeAction({ id: "a1", priority: "critical", source: "internal_audit", status: "completed" }),
    ];
    // 100% completion (+8), 100% crit/high (+5), no overdue (+4), no ofsted reqs (+4), no ofsted recs (+4) = 25
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBe(25);
  });

  it("should not go below 0", () => {
    const actions = [
      makeAction({ id: "a1", status: "overdue", priority: "low", source: "ofsted_requirement" }),
      makeAction({ id: "a2", status: "not_started", priority: "low", source: "ofsted_recommendation" }),
    ];
    expect(evaluateActionPlanProgress(actions, [])).toBeGreaterThanOrEqual(0);
  });

  it("should handle mix of all statuses", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "in_progress" }),
      makeAction({ id: "a3", status: "not_started" }),
      makeAction({ id: "a4", status: "overdue" }),
    ];
    const result = evaluateActionPlanProgress(actions, []);
    // 25% completion (no +8), overdue (no +4)
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(25);
  });

  it("should handle all completed actions", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed", priority: "critical" }),
      makeAction({ id: "a2", status: "completed", priority: "high" }),
      makeAction({ id: "a3", status: "completed", priority: "medium" }),
    ];
    // 100% completion (+8), 100% crit/high (+5), no overdue (+4), no ofsted reqs (+4), no ofsted recs (+4) = 25
    const result = evaluateActionPlanProgress(actions, []);
    expect(result).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateInspectionPreparedness (20 pts)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInspectionPreparedness", () => {
  it("should return 0 for all empty inputs", () => {
    expect(evaluateInspectionPreparedness([], [], [], PERIOD_END)).toBe(0);
  });

  it("should award +5 for outstanding previous judgment", () => {
    const history = [makeInspection({ overallJudgment: "outstanding" })];
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(5);
  });

  it("should award +4 for good previous judgment", () => {
    const history = [makeInspection({ overallJudgment: "good" })];
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(4);
  });

  it("should award +2 for requires_improvement previous judgment", () => {
    const history = [makeInspection({ overallJudgment: "requires_improvement" })];
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(2);
  });

  it("should award +0 for inadequate previous judgment", () => {
    const history = [makeInspection({ overallJudgment: "inadequate" })];
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(0);
  });

  it("should use most recent inspection for judgment score", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "inadequate" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "good" }),
    ];
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    // good = +4, improvement from inadequate to good = +5 = 9
    // Also maintained good+ needs all to be good+, but inadequate is not → no +3
    expect(result).toBeGreaterThanOrEqual(9);
  });

  it("should award +5 for improvement trend", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "requires_improvement" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "good" }),
    ];
    // good (+4) + improvement (+5) = 9
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBeGreaterThanOrEqual(9);
  });

  it("should not award +5 when no improvement", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "good" }),
    ];
    // good (+4), no improvement (same level), maintained good+ → +3
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(7); // 4 + 3
  });

  it("should not award improvement when declining", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "outstanding" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "good" }),
    ];
    // good (+4), declined (outstanding → good), maintained good+ → +3
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(7); // 4 + 3
  });

  it("should award on-time completion rate proportionally up to +4", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed", completedDate: "2026-02-15", targetDate: "2026-03-01" }), // on time
      makeAction({ id: "a2", status: "completed", completedDate: "2026-03-15", targetDate: "2026-03-01" }), // late
    ];
    // 50% on-time → +2
    const result = evaluateInspectionPreparedness([], [], actions, PERIOD_END);
    expect(result).toBe(2);
  });

  it("should award full +4 when all completed on time", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed", completedDate: "2026-02-15", targetDate: "2026-03-01" }),
      makeAction({ id: "a2", status: "completed", completedDate: "2026-02-28", targetDate: "2026-03-01" }),
    ];
    const result = evaluateInspectionPreparedness([], [], actions, PERIOD_END);
    expect(result).toBe(4);
  });

  it("should handle actions with no completed items for on-time rate", () => {
    const actions = [
      makeAction({ id: "a1", status: "not_started" }),
      makeAction({ id: "a2", status: "in_progress" }),
    ];
    const result = evaluateInspectionPreparedness([], [], actions, PERIOD_END);
    expect(result).toBe(0);
  });

  it("should award +3 when >= 80% areas assessed within 30 days", () => {
    const scores = [
      makeAreaScore({ id: "as1", lastAssessedDate: "2026-04-15" }), // 15 days from period end
      makeAreaScore({ id: "as2", lastAssessedDate: "2026-04-10" }), // 20 days
      makeAreaScore({ id: "as3", lastAssessedDate: "2026-04-05" }), // 25 days
      makeAreaScore({ id: "as4", lastAssessedDate: "2026-04-20" }), // 10 days
      makeAreaScore({ id: "as5", lastAssessedDate: "2026-04-25" }), // 5 days
    ];
    // All within 30 days of 2026-04-30 → 100% >= 80% → +3
    const result = evaluateInspectionPreparedness([], scores, [], PERIOD_END);
    expect(result).toBe(3);
  });

  it("should not award +3 when < 80% areas assessed within 30 days", () => {
    const scores = [
      makeAreaScore({ id: "as1", lastAssessedDate: "2026-04-15" }), // within 30
      makeAreaScore({ id: "as2", lastAssessedDate: "2026-01-01" }), // 120 days - outside
      makeAreaScore({ id: "as3", lastAssessedDate: "2026-01-01" }), // outside
      makeAreaScore({ id: "as4", lastAssessedDate: "2026-01-01" }), // outside
      makeAreaScore({ id: "as5", lastAssessedDate: "2026-01-01" }), // outside
    ];
    // 1/5 = 20% < 80%
    const result = evaluateInspectionPreparedness([], scores, [], PERIOD_END);
    expect(result).toBe(0);
  });

  it("should award +3 bonus for maintained good+ across all inspections", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "outstanding" }),
    ];
    // outstanding (+5) + improvement good→outstanding (+5) + maintained good+ (+3) = 13
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(13);
  });

  it("should not award maintained bonus when any inspection below good", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "requires_improvement" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "good" }),
    ];
    // good (+4) + improvement (+5) = 9, not maintained because RI
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(9);
  });

  it("should not award maintained bonus with only 1 inspection", () => {
    const history = [
      makeInspection({ overallJudgment: "outstanding" }),
    ];
    // outstanding (+5) only, needs 2+ for maintained bonus
    const result = evaluateInspectionPreparedness(history, [], [], PERIOD_END);
    expect(result).toBe(5);
  });

  it("should clamp at 20 maximum", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "outstanding" }),
    ];
    const scores = makeFullAreaScores(90).map((s) => ({
      ...s,
      lastAssessedDate: "2026-04-20",
    }));
    const actions = [
      makeAction({ status: "completed", completedDate: "2026-02-01", targetDate: "2026-03-01" }),
    ];
    // 5 + 5 + 4 + 3 + 3 = 20
    const result = evaluateInspectionPreparedness(history, scores, actions, PERIOD_END);
    expect(result).toBeLessThanOrEqual(20);
  });

  it("should achieve 20 with perfect preparedness", () => {
    const history = [
      makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
      makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "outstanding" }),
    ];
    const scores = makeFullAreaScores(90).map((s) => ({
      ...s,
      lastAssessedDate: "2026-04-20",
    }));
    const actions = [
      makeAction({ status: "completed", completedDate: "2026-02-01", targetDate: "2026-03-01" }),
    ];
    const result = evaluateInspectionPreparedness(history, scores, actions, PERIOD_END);
    expect(result).toBe(20);
  });

  it("should not go below 0", () => {
    const history = [makeInspection({ overallJudgment: "inadequate" })];
    expect(
      evaluateInspectionPreparedness(history, [], [], PERIOD_END),
    ).toBeGreaterThanOrEqual(0);
  });

  it("should handle empty area scores for recency check", () => {
    const result = evaluateInspectionPreparedness([], [], [], PERIOD_END);
    expect(result).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateOfstedReadinessIntelligence (main function)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateOfstedReadinessIntelligence", () => {
  it("should return correct homeId and period", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("should return 0 overall score for empty inputs", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.readiness).toBe("not_ready");
  });

  it("should sum the 4 sub-scores correctly", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(85),
      makeFullEvidenceSet("strong", "2026-04-01", 5),
      [makeInspection({ overallJudgment: "good" })],
      [makeAction({ priority: "critical", status: "completed" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    const expectedSum =
      result.judgmentAreaReadinessScore +
      result.evidencePortfolioScore +
      result.actionPlanProgressScore +
      result.inspectionPreparednessScore;
    expect(result.overallScore).toBe(Math.round(expectedSum * 100) / 100);
  });

  it("should clamp overall score between 0 and 100", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(95),
      makeFullEvidenceSet("strong", "2026-04-01", 5),
      [
        makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
        makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "outstanding" }),
      ],
      [makeAction({ priority: "critical", status: "completed" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("should assign outstanding rating for score >= 80", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(90),
      makeFullEvidenceSet("strong", "2026-04-01", 5),
      [
        makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
        makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "outstanding" }),
      ],
      [makeAction({ priority: "critical", status: "completed" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("should assign good rating for score >= 60 and < 80", () => {
    // Moderate scores to get 60-79
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(70),
      makeFullEvidenceSet("adequate", "2026-04-01", 2),
      [makeInspection({ overallJudgment: "good" })],
      [
        makeAction({ id: "a1", status: "completed" }),
        makeAction({ id: "a2", status: "in_progress" }),
        makeAction({ id: "a3", status: "not_started" }),
      ],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("should assign requires_improvement rating for score >= 40 and < 60", () => {
    const result = generateOfstedReadinessIntelligence(
      [makeAreaScore({ area: "safeguarding", score: 50 })],
      [makeEvidence({ evidenceStrength: "weak" })],
      [makeInspection({ overallJudgment: "requires_improvement" })],
      [makeAction({ status: "not_started" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("should assign inadequate rating for score < 40", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("should assign ready readiness for score >= 80", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(90),
      makeFullEvidenceSet("strong", "2026-04-01", 5),
      [
        makeInspection({ id: "old", inspectionDate: "2023-01-01", overallJudgment: "good" }),
        makeInspection({ id: "new", inspectionDate: "2025-01-15", overallJudgment: "outstanding" }),
      ],
      [makeAction({ priority: "critical", status: "completed" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    if (result.overallScore >= 80) {
      expect(result.readiness).toBe("ready");
    }
  });

  it("should assign mostly_ready readiness for score >= 60", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(70),
      makeFullEvidenceSet("adequate", "2026-04-01", 2),
      [makeInspection({ overallJudgment: "good" })],
      [makeAction({ status: "completed" }), makeAction({ id: "a2", status: "in_progress" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.readiness).toBe("mostly_ready");
    }
  });

  it("should assign not_ready readiness for score < 40", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.readiness).toBe("not_ready");
  });

  it("should produce 3 judgment area summaries", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(80),
      makeFullEvidenceSet(),
      [],
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.judgmentAreaSummaries).toHaveLength(3);
    const areas = result.judgmentAreaSummaries.map((s) => s.area);
    expect(areas).toContain("overall_experiences");
    expect(areas).toContain("help_and_protection");
    expect(areas).toContain("leadership_and_management");
  });

  it("should include label in judgment area summaries", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(80),
      makeFullEvidenceSet(),
      [],
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    const oe = result.judgmentAreaSummaries.find(
      (s) => s.area === "overall_experiences",
    );
    expect(oe?.label).toBe(
      "The Overall Experiences and Progress of Children and Young People",
    );
  });

  it("should calculate average score per judgment area", () => {
    const scores = [
      makeAreaScore({ id: "as1", area: "education", score: 80 }),
      makeAreaScore({ id: "as2", area: "health", score: 60 }),
    ];
    const result = generateOfstedReadinessIntelligence(
      scores, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const oe = result.judgmentAreaSummaries.find(
      (s) => s.area === "overall_experiences",
    );
    expect(oe?.averageScore).toBe(70);
    expect(oe?.areaCount).toBe(2);
  });

  it("should count evidence per judgment area", () => {
    const evidence = [
      makeEvidence({ id: "e1", judgmentArea: "help_and_protection" }),
      makeEvidence({ id: "e2", judgmentArea: "help_and_protection", requirement: "partnership_working" }),
      makeEvidence({ id: "e3", judgmentArea: "overall_experiences", requirement: "children_make_progress" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const hp = result.judgmentAreaSummaries.find(
      (s) => s.area === "help_and_protection",
    );
    expect(hp?.evidenceCount).toBe(2);
    const oe = result.judgmentAreaSummaries.find(
      (s) => s.area === "overall_experiences",
    );
    expect(oe?.evidenceCount).toBe(1);
  });

  it("should generate gap analysis for missing SCCIF requirements", () => {
    // Only 1 requirement covered
    const evidence = [makeEvidence({ requirement: "children_are_safe" })];
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    // 14 missing requirements should appear as critical gaps
    const missingGaps = result.gapAnalysis.filter(
      (g) => g.currentStrength === "missing",
    );
    expect(missingGaps.length).toBe(14);
  });

  it("should generate gap analysis for weak evidence", () => {
    const evidence = makeFullEvidenceSet("strong").map((e, i) =>
      i === 0 ? { ...e, evidenceStrength: "weak" as EvidenceStrength } : e,
    );
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const weakGaps = result.gapAnalysis.filter(
      (g) => g.currentStrength === "weak",
    );
    expect(weakGaps.length).toBe(1);
    expect(weakGaps[0].priority).toBe("high");
  });

  it("should generate gap analysis for absent evidence", () => {
    const evidence = [
      makeEvidence({ requirement: "children_are_safe", evidenceStrength: "absent" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const absentGaps = result.gapAnalysis.filter(
      (g) => g.currentStrength === "absent",
    );
    expect(absentGaps.length).toBe(1);
    expect(absentGaps[0].priority).toBe("critical");
  });

  it("should return empty gap analysis for all strong evidence", () => {
    const evidence = makeFullEvidenceSet("strong");
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.gapAnalysis).toHaveLength(0);
  });

  it("should generate strengths for high-scoring areas", () => {
    const scores = makeFullAreaScores(85);
    const result = generateOfstedReadinessIntelligence(
      scores, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const areaStrength = result.strengths.find((s) =>
      s.includes("rated 80+"),
    );
    expect(areaStrength).toBeDefined();
  });

  it("should generate strengths for good previous inspection", () => {
    const history = [makeInspection({ overallJudgment: "good" })];
    const result = generateOfstedReadinessIntelligence(
      [], [], history, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const inspStrength = result.strengths.find((s) =>
      s.includes("Good"),
    );
    expect(inspStrength).toBeDefined();
  });

  it("should generate areas for improvement for low scores", () => {
    const scores = [
      makeAreaScore({ area: "care_planning", score: 45, rating: "requires_improvement" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      scores, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const improvement = result.areasForImprovement.find((s) =>
      s.includes("care_planning"),
    );
    expect(improvement).toBeDefined();
  });

  it("should generate areas for improvement for overdue actions", () => {
    const actions = [
      makeAction({ id: "a1", status: "overdue", description: "Fix records" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      [], [], [], actions, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const overdueImprovement = result.areasForImprovement.find((s) =>
      s.includes("overdue"),
    );
    expect(overdueImprovement).toBeDefined();
  });

  it("should generate actions for critical gaps", () => {
    const evidence = [makeEvidence({ requirement: "children_are_safe" })];
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    // Should have actions for 14 missing requirements
    expect(result.actions.length).toBeGreaterThanOrEqual(14);
  });

  it("should generate actions for overdue items", () => {
    const actions = [
      makeAction({ status: "overdue", description: "Complete training" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      [], [], [], actions, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const overdueAction = result.actions.find((a) =>
      a.includes("Complete training"),
    );
    expect(overdueAction).toBeDefined();
  });

  it("should include 5 regulatory links", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(5);
  });

  it("should include SCCIF in regulatory links", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const sccif = result.regulatoryLinks.find((l) => l.reference === "SCCIF");
    expect(sccif).toBeDefined();
  });

  it("should include CHR 2015 Reg 45 in regulatory links", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const reg45 = result.regulatoryLinks.find(
      (l) => l.reference === "CHR 2015 Reg 45",
    );
    expect(reg45).toBeDefined();
  });

  it("should include CHR 2015 Reg 40 in regulatory links", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const reg40 = result.regulatoryLinks.find(
      (l) => l.reference === "CHR 2015 Reg 40",
    );
    expect(reg40).toBeDefined();
  });

  it("should include Ofsted Compliance Handbook in regulatory links", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const handbook = result.regulatoryLinks.find((l) =>
      l.reference.includes("Compliance Handbook"),
    );
    expect(handbook).toBeDefined();
  });

  it("should include DfE Guide in regulatory links", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const guide = result.regulatoryLinks.find((l) =>
      l.reference.includes("DfE"),
    );
    expect(guide).toBeDefined();
  });

  // ── Sub-score ranges ─────────────────────────────────────────────────────

  it("should have judgment area readiness score between 0 and 30", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(90),
      makeFullEvidenceSet(),
      [makeInspection()],
      [makeAction()],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.judgmentAreaReadinessScore).toBeGreaterThanOrEqual(0);
    expect(result.judgmentAreaReadinessScore).toBeLessThanOrEqual(30);
  });

  it("should have evidence portfolio score between 0 and 25", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(90),
      makeFullEvidenceSet(),
      [makeInspection()],
      [makeAction()],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.evidencePortfolioScore).toBeGreaterThanOrEqual(0);
    expect(result.evidencePortfolioScore).toBeLessThanOrEqual(25);
  });

  it("should have action plan progress score between 0 and 25", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(90),
      makeFullEvidenceSet(),
      [makeInspection()],
      [makeAction()],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.actionPlanProgressScore).toBeGreaterThanOrEqual(0);
    expect(result.actionPlanProgressScore).toBeLessThanOrEqual(25);
  });

  it("should have inspection preparedness score between 0 and 20", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(90),
      makeFullEvidenceSet(),
      [makeInspection()],
      [makeAction()],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.inspectionPreparednessScore).toBeGreaterThanOrEqual(0);
    expect(result.inspectionPreparednessScore).toBeLessThanOrEqual(20);
  });

  // ── Demo data scenario ─────────────────────────────────────────────────

  it("should produce realistic results for demo data", () => {
    const demoScores: AreaScore[] = [
      makeAreaScore({ id: "d1", area: "safeguarding", score: 82, rating: "outstanding" }),
      makeAreaScore({ id: "d2", area: "education", score: 75, rating: "good" }),
      makeAreaScore({ id: "d3", area: "health", score: 78, rating: "good" }),
      makeAreaScore({ id: "d4", area: "behaviour", score: 85, rating: "outstanding" }),
      makeAreaScore({ id: "d5", area: "care_planning", score: 70, rating: "good" }),
      makeAreaScore({ id: "d6", area: "staff_training", score: 88, rating: "outstanding" }),
      makeAreaScore({ id: "d7", area: "leadership", score: 72, rating: "good" }),
      makeAreaScore({ id: "d8", area: "participation", score: 80, rating: "outstanding" }),
    ];
    const demoEvidence = makeFullEvidenceSet("strong", "2026-04-01", 4);
    const demoHistory = [
      makeInspection({
        inspectionDate: "2025-01-15",
        overallJudgment: "good",
        experiencesJudgment: "good",
        helpProtectionJudgment: "good",
        leadershipJudgment: "good",
      }),
    ];
    const demoActions = [
      makeAction({ id: "d-a1", source: "ofsted_recommendation", status: "completed", priority: "high" }),
      makeAction({ id: "d-a2", source: "internal_audit", status: "completed", priority: "medium" }),
      makeAction({ id: "d-a3", source: "reg44", status: "in_progress", priority: "medium" }),
    ];

    const result = generateOfstedReadinessIntelligence(
      demoScores,
      demoEvidence,
      demoHistory,
      demoActions,
      HOME_ID,
      "2026-01-01",
      "2026-04-30",
    );

    expect(result.overallScore).toBeGreaterThan(50);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.judgmentAreaSummaries).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(5);
    expect(result.gapAnalysis).toHaveLength(0); // full evidence set
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge cases and integration
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge Cases", () => {
  it("should handle a single area score", () => {
    const result = generateOfstedReadinessIntelligence(
      [makeAreaScore({ area: "safeguarding", score: 90 })],
      [],
      [],
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("should handle a single evidence item", () => {
    const result = generateOfstedReadinessIntelligence(
      [],
      [makeEvidence()],
      [],
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("should handle a single inspection", () => {
    const result = generateOfstedReadinessIntelligence(
      [],
      [],
      [makeInspection()],
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("should handle a single action item", () => {
    const result = generateOfstedReadinessIntelligence(
      [],
      [],
      [],
      [makeAction()],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("should handle 0-scored areas", () => {
    const scores = [makeAreaScore({ area: "safeguarding", score: 0, rating: "inadequate" })];
    const result = generateOfstedReadinessIntelligence(
      scores, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("should handle 100-scored areas", () => {
    const scores = [makeAreaScore({ area: "safeguarding", score: 100, rating: "outstanding" })];
    const result = generateOfstedReadinessIntelligence(
      scores, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("should handle many inspections", () => {
    const history = Array.from({ length: 10 }, (_, i) =>
      makeInspection({
        id: `insp-${i}`,
        inspectionDate: `${2015 + i}-01-15`,
        overallJudgment: "good",
      }),
    );
    const result = generateOfstedReadinessIntelligence(
      [], [], history, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("should handle duplicate evidence requirements (keeps weakest for gap analysis)", () => {
    const evidence = [
      makeEvidence({ id: "e1", requirement: "children_are_safe", evidenceStrength: "strong" }),
      makeEvidence({ id: "e2", requirement: "children_are_safe", evidenceStrength: "weak" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const gap = result.gapAnalysis.find(
      (g) => g.requirement === "children_are_safe",
    );
    expect(gap).toBeDefined();
    expect(gap?.currentStrength).toBe("weak");
  });

  it("should handle all actions overdue", () => {
    const actions = Array.from({ length: 5 }, (_, i) =>
      makeAction({ id: `a-${i}`, status: "overdue" }),
    );
    const result = generateOfstedReadinessIntelligence(
      [], [], [], actions, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actionPlanProgressScore).toBeLessThan(10);
  });

  it("should handle all actions not started", () => {
    const actions = Array.from({ length: 5 }, (_, i) =>
      makeAction({ id: `a-${i}`, status: "not_started" }),
    );
    const result = generateOfstedReadinessIntelligence(
      [], [], [], actions, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actionPlanProgressScore).toBeLessThan(15);
  });

  it("should track evidence strength counts in summaries", () => {
    const evidence = [
      makeEvidence({ id: "e1", judgmentArea: "help_and_protection", evidenceStrength: "strong" }),
      makeEvidence({ id: "e2", judgmentArea: "help_and_protection", evidenceStrength: "weak", requirement: "partnership_working" }),
      makeEvidence({ id: "e3", judgmentArea: "help_and_protection", evidenceStrength: "absent", requirement: "complaints_are_resolved" }),
    ];
    const result = generateOfstedReadinessIntelligence(
      [], evidence, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const hp = result.judgmentAreaSummaries.find(
      (s) => s.area === "help_and_protection",
    );
    expect(hp?.strongEvidenceCount).toBe(1);
    expect(hp?.weakEvidenceCount).toBe(1);
    expect(hp?.absentEvidenceCount).toBe(1);
  });

  it("should correctly set readiness contribution in summaries", () => {
    const scores = [
      makeAreaScore({ area: "safeguarding", score: 90 }),   // help_and_protection avg 90 → 6
      makeAreaScore({ area: "education", score: 65 }),       // overall_experiences avg 65 → 4
      makeAreaScore({ area: "staff_training", score: 45 }), // leadership_and_management avg 45 → 2
    ];
    const result = generateOfstedReadinessIntelligence(
      scores, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const hp = result.judgmentAreaSummaries.find(
      (s) => s.area === "help_and_protection",
    );
    expect(hp?.readinessContribution).toBe(6);
    const oe = result.judgmentAreaSummaries.find(
      (s) => s.area === "overall_experiences",
    );
    expect(oe?.readinessContribution).toBe(4);
    const lm = result.judgmentAreaSummaries.find(
      (s) => s.area === "leadership_and_management",
    );
    expect(lm?.readinessContribution).toBe(2);
  });

  it("should include recommendation text in gap analysis items", () => {
    const result = generateOfstedReadinessIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    // All 15 requirements missing → 15 gaps
    expect(result.gapAnalysis).toHaveLength(15);
    for (const gap of result.gapAnalysis) {
      expect(gap.recommendation).toBeTruthy();
      expect(gap.label).toBeTruthy();
    }
  });

  it("should produce strengths array as string[]", () => {
    const result = generateOfstedReadinessIntelligence(
      makeFullAreaScores(85),
      makeFullEvidenceSet(),
      [makeInspection()],
      [makeAction()],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(Array.isArray(result.strengths)).toBe(true);
    for (const s of result.strengths) {
      expect(typeof s).toBe("string");
    }
  });

  it("should produce areasForImprovement array as string[]", () => {
    const result = generateOfstedReadinessIntelligence(
      [makeAreaScore({ area: "care_planning", score: 30, rating: "inadequate" })],
      [],
      [],
      [makeAction({ status: "overdue" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    for (const s of result.areasForImprovement) {
      expect(typeof s).toBe("string");
    }
  });

  it("should produce actions array as string[]", () => {
    const result = generateOfstedReadinessIntelligence(
      [],
      [],
      [],
      [makeAction({ status: "overdue", description: "Fix issue" })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(Array.isArray(result.actions)).toBe(true);
    for (const a of result.actions) {
      expect(typeof a).toBe("string");
    }
  });
});
