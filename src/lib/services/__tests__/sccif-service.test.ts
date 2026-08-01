// ==============================================================================
// CARA -- SCCIF SELF-EVALUATION SERVICE TESTS
// Pure-function tests for self-evaluation summaries, judgment grade suggestions,
// inspection readiness alerts, and constant validation.
// ==============================================================================

import { describe, it, expect } from "vitest";
import { _testing } from "../sccif-service";
import {
  SCCIF_JUDGMENTS,
  JUDGMENT_GRADES,
  SCCIF_EVIDENCE_AREAS,
} from "../sccif-service";
import type { EvidenceEntry, SelfEvaluation } from "../sccif-service";

const {
  computeSelfEvaluationSummary,
  suggestJudgmentGrade,
  identifySCCIFAlerts,
} = _testing;

// -- Helpers ------------------------------------------------------------------

/** Build a minimal evidence entry with sensible defaults. */
function makeEvidenceEntry(
  overrides: Partial<{
    id: string;
    home_id: string;
    evaluation_id: string;
    evidence_area: string;
    description: string;
    data_source: string | null;
    metric_value: number | null;
    metric_label: string | null;
    grade_indicator: "strength" | "area_for_development" | "neutral";
    regulation_reference: string | null;
    created_at: string;
  }> = {},
): EvidenceEntry {
  return {
    id: "id" in overrides ? overrides.id! : "ev-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    evaluation_id: "evaluation_id" in overrides ? overrides.evaluation_id! : "eval-1",
    evidence_area: "evidence_area" in overrides ? overrides.evidence_area! : "care_planning",
    description: "description" in overrides ? overrides.description! : "Test evidence",
    data_source: "data_source" in overrides ? overrides.data_source! : null,
    metric_value: "metric_value" in overrides ? overrides.metric_value! : null,
    metric_label: "metric_label" in overrides ? overrides.metric_label! : null,
    grade_indicator: "grade_indicator" in overrides ? overrides.grade_indicator! : "strength",
    regulation_reference: "regulation_reference" in overrides ? overrides.regulation_reference! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
  };
}

/** Build a minimal self-evaluation with sensible defaults. */
function makeSelfEvaluation(
  overrides: Partial<{
    id: string;
    home_id: string;
    period_from: string;
    period_to: string;
    status: "draft" | "in_review" | "final";
    overall_grade: string | null;
    helped_protected_grade: string | null;
    leadership_grade: string | null;
    strengths: string[];
    areas_for_improvement: string[];
    created_by: string;
    approved_by: string | null;
    approved_date: string | null;
    created_at: string;
    updated_at: string;
  }> = {},
): SelfEvaluation {
  return {
    id: "id" in overrides ? overrides.id! : "eval-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    period_from: "period_from" in overrides ? overrides.period_from! : "2026-01-01",
    period_to: "period_to" in overrides ? overrides.period_to! : "2026-12-31",
    status: "status" in overrides ? overrides.status! : "draft",
    overall_grade: "overall_grade" in overrides ? overrides.overall_grade! : null,
    helped_protected_grade: "helped_protected_grade" in overrides ? overrides.helped_protected_grade! : null,
    leadership_grade: "leadership_grade" in overrides ? overrides.leadership_grade! : null,
    strengths: "strengths" in overrides ? overrides.strengths! : [],
    areas_for_improvement: "areas_for_improvement" in overrides ? overrides.areas_for_improvement! : [],
    created_by: "created_by" in overrides ? overrides.created_by! : "user-1",
    approved_by: "approved_by" in overrides ? overrides.approved_by! : null,
    approved_date: "approved_date" in overrides ? overrides.approved_date! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

// -- SCCIF_JUDGMENTS ----------------------------------------------------------

describe("SCCIF_JUDGMENTS", () => {
  it("has exactly 3 judgments", () => {
    expect(SCCIF_JUDGMENTS).toHaveLength(3);
  });

  it("each entry has key, label, and order properties", () => {
    for (const j of SCCIF_JUDGMENTS) {
      expect(typeof j.key).toBe("string");
      expect(typeof j.label).toBe("string");
      expect(typeof j.order).toBe("number");
    }
  });

  it("contains expected judgment keys", () => {
    const keys = SCCIF_JUDGMENTS.map((j) => j.key);
    expect(keys).toContain("overall_experiences");
    expect(keys).toContain("helped_and_protected");
    expect(keys).toContain("leadership_and_management");
  });

  it("judgments are ordered 1, 2, 3", () => {
    expect(SCCIF_JUDGMENTS[0].order).toBe(1);
    expect(SCCIF_JUDGMENTS[1].order).toBe(2);
    expect(SCCIF_JUDGMENTS[2].order).toBe(3);
  });

  it("has correct label for overall_experiences", () => {
    const found = SCCIF_JUDGMENTS.find((j) => j.key === "overall_experiences");
    expect(found?.label).toBe("Overall experiences and progress of children and young people");
  });

  it("has correct label for helped_and_protected", () => {
    const found = SCCIF_JUDGMENTS.find((j) => j.key === "helped_and_protected");
    expect(found?.label).toBe("How well children and young people are helped and protected");
  });
});

// -- JUDGMENT_GRADES ----------------------------------------------------------

describe("JUDGMENT_GRADES", () => {
  it("has exactly 4 grades", () => {
    expect(JUDGMENT_GRADES).toHaveLength(4);
  });

  it("contains all expected grades", () => {
    expect(JUDGMENT_GRADES).toContain("outstanding");
    expect(JUDGMENT_GRADES).toContain("good");
    expect(JUDGMENT_GRADES).toContain("requires_improvement");
    expect(JUDGMENT_GRADES).toContain("inadequate");
  });

  it("all entries are strings", () => {
    for (const grade of JUDGMENT_GRADES) {
      expect(typeof grade).toBe("string");
    }
  });

  it("starts with outstanding and ends with inadequate", () => {
    expect(JUDGMENT_GRADES[0]).toBe("outstanding");
    expect(JUDGMENT_GRADES[JUDGMENT_GRADES.length - 1]).toBe("inadequate");
  });
});

// -- SCCIF_EVIDENCE_AREAS -----------------------------------------------------

describe("SCCIF_EVIDENCE_AREAS", () => {
  it("has exactly 20 evidence areas", () => {
    expect(SCCIF_EVIDENCE_AREAS).toHaveLength(20);
  });

  it("each entry has area, judgment, and regulation properties", () => {
    for (const ea of SCCIF_EVIDENCE_AREAS) {
      expect(typeof ea.area).toBe("string");
      expect(typeof ea.judgment).toBe("string");
      expect(typeof ea.regulation).toBe("string");
    }
  });

  it("all judgment references are valid SCCIF_JUDGMENTS keys", () => {
    const validKeys = SCCIF_JUDGMENTS.map((j) => j.key);
    for (const ea of SCCIF_EVIDENCE_AREAS) {
      expect(validKeys).toContain(ea.judgment);
    }
  });

  it("contains expected evidence areas", () => {
    const areas = SCCIF_EVIDENCE_AREAS.map((ea) => ea.area);
    expect(areas).toContain("care_planning");
    expect(areas).toContain("safeguarding");
    expect(areas).toContain("staffing_supervision");
    expect(areas).toContain("child_voice");
    expect(areas).toContain("premises_safety");
  });

  it("maps care_planning to overall_experiences with correct regulation", () => {
    const found = SCCIF_EVIDENCE_AREAS.find((ea) => ea.area === "care_planning");
    expect(found?.judgment).toBe("overall_experiences");
    expect(found?.regulation).toBe("Reg 14");
  });

  it("maps safeguarding to helped_and_protected", () => {
    const found = SCCIF_EVIDENCE_AREAS.find((ea) => ea.area === "safeguarding");
    expect(found?.judgment).toBe("helped_and_protected");
    expect(found?.regulation).toBe("Reg 12/34");
  });

  it("maps staffing_supervision to leadership_and_management", () => {
    const found = SCCIF_EVIDENCE_AREAS.find((ea) => ea.area === "staffing_supervision");
    expect(found?.judgment).toBe("leadership_and_management");
    expect(found?.regulation).toBe("Reg 33/34");
  });

  it("has 7 areas under overall_experiences", () => {
    const count = SCCIF_EVIDENCE_AREAS.filter((ea) => ea.judgment === "overall_experiences").length;
    expect(count).toBe(7);
  });

  it("has 6 areas under helped_and_protected", () => {
    const count = SCCIF_EVIDENCE_AREAS.filter((ea) => ea.judgment === "helped_and_protected").length;
    expect(count).toBe(6);
  });

  it("has 7 areas under leadership_and_management", () => {
    const count = SCCIF_EVIDENCE_AREAS.filter((ea) => ea.judgment === "leadership_and_management").length;
    expect(count).toBe(7);
  });
});

// -- computeSelfEvaluationSummary ---------------------------------------------

describe("computeSelfEvaluationSummary", () => {
  it("returns zeroed metrics for empty array", () => {
    const result = computeSelfEvaluationSummary([]);
    expect(result.total_evidence).toBe(0);
    expect(result.strength_percentage).toBeNull();; expect(result.coverage).toBe(0);
    expect(result.by_area).toEqual({});
  });

  it("returns all 20 areas as uncovered when no evidence", () => {
    const result = computeSelfEvaluationSummary([]);
    expect(result.uncovered_areas).toHaveLength(20);
  });

  it("initialises all three judgment buckets even with no evidence", () => {
    const result = computeSelfEvaluationSummary([]);
    expect(result.by_judgment).toHaveProperty("overall_experiences");
    expect(result.by_judgment).toHaveProperty("helped_and_protected");
    expect(result.by_judgment).toHaveProperty("leadership_and_management");
    for (const key of Object.keys(result.by_judgment)) {
      expect(result.by_judgment[key]).toEqual({ strengths: 0, developments: 0, neutral: 0, total: 0 });
    }
  });

  it("counts total evidence entries", () => {
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry(),
      makeEvidenceEntry({ id: "ev-2" }),
      makeEvidenceEntry({ id: "ev-3" }),
    ]);
    expect(result.total_evidence).toBe(3);
  });

  it("tallies strengths, developments, and neutral by judgment", () => {
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "health_wellbeing", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "positive_relationships", grade_indicator: "neutral" }),
    ]);
    // All four areas belong to overall_experiences
    expect(result.by_judgment.overall_experiences.strengths).toBe(2);
    expect(result.by_judgment.overall_experiences.developments).toBe(1);
    expect(result.by_judgment.overall_experiences.neutral).toBe(1);
    expect(result.by_judgment.overall_experiences.total).toBe(4);
  });

  it("tallies by_area correctly", () => {
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ evidence_area: "safeguarding", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "safeguarding", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "safeguarding", grade_indicator: "strength" }),
    ]);
    expect(result.by_area.safeguarding).toEqual({ strengths: 2, developments: 1, total: 3 });
  });

  it("computes strength_percentage correctly", () => {
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-4", grade_indicator: "neutral" }),
    ]);
    // 2 strengths / 4 total = 50%
    expect(result.strength_percentage).toBe(50);
  });

  it("computes coverage as percentage of SCCIF areas with at least 1 entry", () => {
    // Cover 1 of 20 areas
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ evidence_area: "care_planning" }),
    ]);
    // 1/20 * 100 = 5.0
    expect(result.coverage).toBe(5);
    expect(result.uncovered_areas).toHaveLength(19);
  });

  it("removes covered areas from uncovered_areas list", () => {
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ evidence_area: "care_planning" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "safeguarding" }),
    ]);
    expect(result.uncovered_areas).not.toContain("care_planning");
    expect(result.uncovered_areas).not.toContain("safeguarding");
    expect(result.uncovered_areas).toHaveLength(18);
  });

  it("handles evidence for unknown areas gracefully (not in SCCIF_EVIDENCE_AREAS)", () => {
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ evidence_area: "unknown_area", grade_indicator: "strength" }),
    ]);
    // Should still count as total evidence and in by_area
    expect(result.total_evidence).toBe(1);
    expect(result.by_area.unknown_area).toEqual({ strengths: 1, developments: 0, total: 1 });
    // Unknown area does not map to any judgment, so judgment totals remain 0
    for (const key of Object.keys(result.by_judgment)) {
      expect(result.by_judgment[key].total).toBe(0);
    }
  });

  it("returns 100% coverage when all 21 areas have evidence", () => {
    const entries = SCCIF_EVIDENCE_AREAS.map((ea, i) =>
      makeEvidenceEntry({ id: `ev-${i}`, evidence_area: ea.area }),
    );
    const result = computeSelfEvaluationSummary(entries);
    expect(result.coverage).toBe(100);
    expect(result.uncovered_areas).toHaveLength(0);
  });

  it("rounds strength_percentage to one decimal place", () => {
    // 1 strength out of 3 = 33.333...% -> 33.3
    const result = computeSelfEvaluationSummary([
      makeEvidenceEntry({ grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-3", grade_indicator: "neutral" }),
    ]);
    expect(result.strength_percentage).toBe(33.3);
  });
});

// -- suggestJudgmentGrade -----------------------------------------------------

describe("suggestJudgmentGrade", () => {
  it("returns outstanding when strength ratio >= 80%", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "health_wellbeing", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "positive_relationships", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-5", evidence_area: "independence_skills", grade_indicator: "area_for_development" }),
    ];
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    // 4/5 = 80%
    expect(result.suggested_grade).toBe("outstanding");
    expect(result.strength_ratio).toBe(80);
  });

  it("returns good when strength ratio >= 60% and < 80%", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "health_wellbeing", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "positive_relationships", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-5", evidence_area: "independence_skills", grade_indicator: "area_for_development" }),
    ];
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    // 3/5 = 60%
    expect(result.suggested_grade).toBe("good");
    expect(result.strength_ratio).toBe(60);
  });

  it("returns requires_improvement when strength ratio >= 40% and < 60%", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "health_wellbeing", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "positive_relationships", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-5", evidence_area: "independence_skills", grade_indicator: "area_for_development" }),
    ];
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    // 2/5 = 40%
    expect(result.suggested_grade).toBe("requires_improvement");
    expect(result.strength_ratio).toBe(40);
  });

  it("returns inadequate when strength ratio < 40%", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "health_wellbeing", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "positive_relationships", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-5", evidence_area: "independence_skills", grade_indicator: "area_for_development" }),
    ];
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    // 1/5 = 20%
    expect(result.suggested_grade).toBe("inadequate");
    expect(result.strength_ratio).toBe(20);
  });

  it("returns inadequate with 0 ratio and low confidence for empty entries", () => {
    const result = suggestJudgmentGrade([], "overall_experiences");
    expect(result.suggested_grade).toBe("inadequate");
    expect(result.strength_ratio).toBeNull();; expect(result.evidence_count).toBe(0);
    expect(result.confidence).toBe("low");
  });

  it("returns high confidence when evidence count >= 10", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEvidenceEntry({
        id: `ev-${i}`,
        evidence_area: "care_planning",
        grade_indicator: "strength",
      }),
    );
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    expect(result.confidence).toBe("high");
    expect(result.evidence_count).toBe(10);
  });

  it("returns medium confidence when evidence count >= 5 and < 10", () => {
    const entries = Array.from({ length: 7 }, (_, i) =>
      makeEvidenceEntry({
        id: `ev-${i}`,
        evidence_area: "care_planning",
        grade_indicator: "strength",
      }),
    );
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    expect(result.confidence).toBe("medium");
    expect(result.evidence_count).toBe(7);
  });

  it("returns low confidence when evidence count < 5", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "strength" }),
    ];
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    expect(result.confidence).toBe("low");
    expect(result.evidence_count).toBe(2);
  });

  it("only considers evidence from the specified judgment's areas", () => {
    const entries = [
      // overall_experiences areas
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      // helped_and_protected areas
      makeEvidenceEntry({ id: "ev-2", evidence_area: "safeguarding", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "risk_management", grade_indicator: "area_for_development" }),
    ];
    const result = suggestJudgmentGrade(entries, "overall_experiences");
    // Only care_planning counts -> 1/1 = 100% -> outstanding
    expect(result.evidence_count).toBe(1);
    expect(result.strength_ratio).toBe(100);
    expect(result.suggested_grade).toBe("outstanding");
  });

  it("returns 0 evidence_count for unknown judgment key", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
    ];
    const result = suggestJudgmentGrade(entries, "nonexistent_judgment");
    expect(result.evidence_count).toBe(0);
    expect(result.suggested_grade).toBe("inadequate");
    expect(result.confidence).toBe("low");
  });

  it("rounds strength_ratio to one decimal place", () => {
    // 1 strength out of 3 = 33.333...% -> 33.3
    const entries = [
      makeEvidenceEntry({ evidence_area: "safeguarding", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "risk_management", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "behaviour_management", grade_indicator: "neutral" }),
    ];
    const result = suggestJudgmentGrade(entries, "helped_and_protected");
    expect(result.strength_ratio).toBe(33.3);
  });

  it("correctly grades leadership_and_management judgment", () => {
    const entries = [
      makeEvidenceEntry({ evidence_area: "staffing_supervision", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "training_development", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "quality_of_care_review", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "independent_visits", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-5", evidence_area: "complaints_management", grade_indicator: "area_for_development" }),
    ];
    const result = suggestJudgmentGrade(entries, "leadership_and_management");
    // 4/5 = 80% -> outstanding
    expect(result.suggested_grade).toBe("outstanding");
    expect(result.evidence_count).toBe(5);
  });
});

// -- identifySCCIFAlerts ------------------------------------------------------

describe("identifySCCIFAlerts", () => {
  it("returns empty array when evaluation covers current date and full coverage with all strengths", () => {
    // Create evidence for all 21 areas
    const entries = SCCIF_EVIDENCE_AREAS.map((ea, i) =>
      makeEvidenceEntry({ id: `ev-${i}`, evidence_area: ea.area, grade_indicator: "strength" }),
    );
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31", status: "final" })];
    const result = identifySCCIFAlerts(entries, evals);
    expect(result).toEqual([]);
  });

  // -- no_current_evaluation --

  it("generates no_current_evaluation alert when no evaluation covers current date", () => {
    const evals = [
      makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2020-12-31" }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const noCurrentAlerts = result.filter((a) => a.type === "no_current_evaluation");
    expect(noCurrentAlerts).toHaveLength(1);
    expect(noCurrentAlerts[0].severity).toBe("high");
    expect(noCurrentAlerts[0].message).toContain("No self-evaluation covers the current period");
  });

  it("generates no_current_evaluation alert when evaluations array is empty", () => {
    const result = identifySCCIFAlerts([], []);
    const noCurrentAlerts = result.filter((a) => a.type === "no_current_evaluation");
    expect(noCurrentAlerts).toHaveLength(1);
    expect(noCurrentAlerts[0].severity).toBe("high");
  });

  it("does not generate no_current_evaluation when an evaluation covers today", () => {
    const evals = [
      makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const noCurrentAlerts = result.filter((a) => a.type === "no_current_evaluation");
    expect(noCurrentAlerts).toHaveLength(0);
  });

  // -- low_coverage --

  it("generates low_coverage alert when evidence coverage < 75%", () => {
    // 1 out of 21 areas covered = ~4.8% coverage
    const entries = [makeEvidenceEntry({ evidence_area: "care_planning" })];
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const lowCoverageAlerts = result.filter((a) => a.type === "low_coverage");
    expect(lowCoverageAlerts).toHaveLength(1);
    expect(lowCoverageAlerts[0].severity).toBe("medium");
    expect(lowCoverageAlerts[0].message).toContain("below the recommended 75% threshold");
  });

  it("does not generate low_coverage alert when coverage >= 75%", () => {
    // Cover 16 of 21 areas = ~76.2%
    const entries = SCCIF_EVIDENCE_AREAS.slice(0, 16).map((ea, i) =>
      makeEvidenceEntry({ id: `ev-${i}`, evidence_area: ea.area }),
    );
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const lowCoverageAlerts = result.filter((a) => a.type === "low_coverage");
    expect(lowCoverageAlerts).toHaveLength(0);
  });

  it("low_coverage message includes the number of uncovered areas", () => {
    const entries = [makeEvidenceEntry({ evidence_area: "care_planning" })];
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const lowCoverageAlerts = result.filter((a) => a.type === "low_coverage");
    expect(lowCoverageAlerts[0].message).toContain("19 area(s) have no evidence");
  });

  // -- weak_judgment --

  it("generates weak_judgment alert when a judgment has strength ratio < 40%", () => {
    // All entries for overall_experiences are area_for_development -> 0% strength
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "area_for_development" }),
    ];
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const weakAlerts = result.filter((a) => a.type === "weak_judgment");
    expect(weakAlerts.length).toBeGreaterThanOrEqual(1);
    const overallAlert = weakAlerts.find((a) => a.message.includes("Overall experiences"));
    expect(overallAlert).toBeDefined();
    expect(overallAlert!.severity).toBe("high");
    expect(overallAlert!.message).toContain("0%");
    expect(overallAlert!.message).toContain("inadequate");
  });

  it("does not generate weak_judgment alert when strength ratio >= 40%", () => {
    // 2 strengths out of 4 = 50% -> not weak
    const entries = [
      makeEvidenceEntry({ evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "education_progress", grade_indicator: "strength" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "health_wellbeing", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-4", evidence_area: "positive_relationships", grade_indicator: "area_for_development" }),
    ];
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const weakAlerts = result.filter((a) => a.type === "weak_judgment" && a.message.includes("Overall experiences"));
    expect(weakAlerts).toHaveLength(0);
  });

  it("does not generate weak_judgment alert when judgment has 0 evidence", () => {
    // No evidence at all -> evidence_count is 0 -> grade.evidence_count > 0 is false
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts([], evals);
    const weakAlerts = result.filter((a) => a.type === "weak_judgment");
    expect(weakAlerts).toHaveLength(0);
  });

  // -- uncovered_area --

  it("generates uncovered_area alert for each area with 0 evidence entries", () => {
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts([], evals);
    const uncoveredAlerts = result.filter((a) => a.type === "uncovered_area");
    expect(uncoveredAlerts).toHaveLength(20);
    for (const alert of uncoveredAlerts) {
      expect(alert.severity).toBe("medium");
      expect(alert.message).toContain("No evidence recorded for");
    }
  });

  it("uncovered_area alert includes regulation reference", () => {
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts([], evals);
    const careAlert = result.find(
      (a) => a.type === "uncovered_area" && a.message.includes("care planning"),
    );
    expect(careAlert).toBeDefined();
    expect(careAlert!.message).toContain("Reg 14");
  });

  it("does not generate uncovered_area alert for areas with evidence", () => {
    const entries = SCCIF_EVIDENCE_AREAS.map((ea, i) =>
      makeEvidenceEntry({ id: `ev-${i}`, evidence_area: ea.area }),
    );
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const uncoveredAlerts = result.filter((a) => a.type === "uncovered_area");
    expect(uncoveredAlerts).toHaveLength(0);
  });

  it("uncovered_area message replaces underscores with spaces in area name", () => {
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts([], evals);
    const missingAlert = result.find(
      (a) => a.type === "uncovered_area" && a.message.includes("missing exploitation"),
    );
    expect(missingAlert).toBeDefined();
  });

  // -- draft_too_long --

  it("generates draft_too_long alert for draft evaluation older than 30 days", () => {
    // Use a date far in the past (deterministic)
    const evals = [
      makeSelfEvaluation({
        status: "draft",
        created_at: "2020-01-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const draftAlerts = result.filter((a) => a.type === "draft_too_long");
    expect(draftAlerts).toHaveLength(1);
    expect(draftAlerts[0].severity).toBe("medium");
    expect(draftAlerts[0].message).toContain("days ago has not been finalised");
  });

  it("does not generate draft_too_long alert for recent draft evaluation", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    const evals = [
      makeSelfEvaluation({
        status: "draft",
        created_at: recentDate.toISOString(),
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const draftAlerts = result.filter((a) => a.type === "draft_too_long");
    expect(draftAlerts).toHaveLength(0);
  });

  it("does not generate draft_too_long alert for final evaluation even if old", () => {
    const evals = [
      makeSelfEvaluation({
        status: "final",
        created_at: "2020-01-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const draftAlerts = result.filter((a) => a.type === "draft_too_long");
    expect(draftAlerts).toHaveLength(0);
  });

  it("does not generate draft_too_long alert for in_review evaluation even if old", () => {
    const evals = [
      makeSelfEvaluation({
        status: "in_review",
        created_at: "2020-01-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const draftAlerts = result.filter((a) => a.type === "draft_too_long");
    expect(draftAlerts).toHaveLength(0);
  });

  it("draft_too_long message includes number of days since creation", () => {
    const evals = [
      makeSelfEvaluation({
        status: "draft",
        created_at: "2020-01-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const draftAlerts = result.filter((a) => a.type === "draft_too_long");
    // The message should contain a large number of days
    expect(draftAlerts[0].message).toMatch(/Draft self-evaluation created \d+ days ago/);
  });

  // -- Multiple alerts --

  it("generates multiple alerts from different sources simultaneously", () => {
    // No current eval, no evidence, old draft
    const evals = [
      makeSelfEvaluation({
        status: "draft",
        created_at: "2020-01-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2020-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const types = result.map((a) => a.type);
    expect(types).toContain("no_current_evaluation");
    expect(types).toContain("low_coverage");
    expect(types).toContain("uncovered_area");
    expect(types).toContain("draft_too_long");
  });

  it("generates multiple draft_too_long alerts for multiple old drafts", () => {
    const evals = [
      makeSelfEvaluation({
        id: "eval-1",
        status: "draft",
        created_at: "2020-01-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
      makeSelfEvaluation({
        id: "eval-2",
        status: "draft",
        created_at: "2020-06-01T00:00:00Z",
        period_from: "2020-01-01",
        period_to: "2030-12-31",
      }),
    ];
    const result = identifySCCIFAlerts([], evals);
    const draftAlerts = result.filter((a) => a.type === "draft_too_long");
    expect(draftAlerts).toHaveLength(2);
  });

  it("generates weak_judgment alerts for multiple weak judgments", () => {
    // Create area_for_development entries for all three judgments
    const entries = [
      makeEvidenceEntry({ id: "ev-1", evidence_area: "care_planning", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-2", evidence_area: "safeguarding", grade_indicator: "area_for_development" }),
      makeEvidenceEntry({ id: "ev-3", evidence_area: "staffing_supervision", grade_indicator: "area_for_development" }),
    ];
    const evals = [makeSelfEvaluation({ period_from: "2020-01-01", period_to: "2030-12-31" })];
    const result = identifySCCIFAlerts(entries, evals);
    const weakAlerts = result.filter((a) => a.type === "weak_judgment");
    expect(weakAlerts).toHaveLength(3);
  });
});
