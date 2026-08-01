import { describe, it, expect } from "vitest";
import {
  computeSelfEvaluationSummary,
  suggestJudgmentGrade,
  identifySCCIFAlerts,
  SCCIF_EVIDENCE_AREAS,
} from "./sccif-service";
import type {
  EvidenceEntry,
  SelfEvaluation,
} from "./sccif-service";

// -- Factory Functions --------------------------------------------------------

function makeEvidence(overrides: Partial<EvidenceEntry> = {}): EvidenceEntry {
  return {
    id: "ev-1",
    home_id: "home-1",
    evaluation_id: "eval-1",
    evidence_area: "care_planning",
    description: "Care plans are robust",
    data_source: null,
    metric_value: null,
    metric_label: null,
    grade_indicator: "strength",
    regulation_reference: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeEvaluation(overrides: Partial<SelfEvaluation> = {}): SelfEvaluation {
  return {
    id: "eval-1",
    home_id: "home-1",
    period_from: "2026-01-01",
    period_to: "2026-12-31",
    status: "final",
    overall_grade: "good",
    helped_protected_grade: "good",
    leadership_grade: "good",
    strengths: ["Strong care planning"],
    areas_for_improvement: [],
    created_by: "manager-1",
    approved_by: "director-1",
    approved_date: "2026-02-01",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSelfEvaluationSummary ---------------------------------------------

describe("computeSelfEvaluationSummary", () => {
  it("returns zeroes for empty evidence", () => {
    const s = computeSelfEvaluationSummary([]);
    expect(s.total_evidence).toBe(0);
    expect(s.strength_percentage).toBeNull();; expect(s.coverage).toBe(0);
    expect(s.uncovered_areas).toHaveLength(SCCIF_EVIDENCE_AREAS.length);
  });

  it("computes strength percentage correctly", () => {
    const entries = [
      makeEvidence({ id: "e1", grade_indicator: "strength" }),
      makeEvidence({ id: "e2", grade_indicator: "strength" }),
      makeEvidence({ id: "e3", grade_indicator: "area_for_development" }),
      makeEvidence({ id: "e4", grade_indicator: "neutral" }),
    ];
    const s = computeSelfEvaluationSummary(entries);
    expect(s.total_evidence).toBe(4);
    // strength_percentage = (2/4) * 100 = 50
    expect(s.strength_percentage).toBe(50);
  });

  it("tracks by_judgment tallies correctly", () => {
    const entries = [
      makeEvidence({ id: "e1", evidence_area: "care_planning", grade_indicator: "strength" }),
      makeEvidence({ id: "e2", evidence_area: "safeguarding", grade_indicator: "area_for_development" }),
    ];
    const s = computeSelfEvaluationSummary(entries);
    expect(s.by_judgment["overall_experiences"].strengths).toBe(1);
    expect(s.by_judgment["helped_and_protected"].developments).toBe(1);
  });

  it("computes coverage from unique evidence areas", () => {
    // Cover exactly 2 of the SCCIF_EVIDENCE_AREAS
    const entries = [
      makeEvidence({ id: "e1", evidence_area: "care_planning" }),
      makeEvidence({ id: "e2", evidence_area: "safeguarding" }),
    ];
    const s = computeSelfEvaluationSummary(entries);
    const expectedCoverage = Math.round(((2 / SCCIF_EVIDENCE_AREAS.length) * 100) * 10) / 10;
    expect(s.coverage).toBe(expectedCoverage);
    expect(s.uncovered_areas).toHaveLength(SCCIF_EVIDENCE_AREAS.length - 2);
  });
});

// -- suggestJudgmentGrade -----------------------------------------------------

describe("suggestJudgmentGrade", () => {
  it("returns outstanding for 80%+ strength ratio", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEvidence({ id: `e-${i}`, evidence_area: "care_planning", grade_indicator: "strength" }),
    );
    const g = suggestJudgmentGrade(entries, "overall_experiences");
    expect(g.suggested_grade).toBe("outstanding");
    expect(g.confidence).toBe("high"); // 10 entries
  });

  it("returns good for 60-79% strength ratio", () => {
    const entries = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeEvidence({ id: `s-${i}`, evidence_area: "care_planning", grade_indicator: "strength" }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeEvidence({ id: `d-${i}`, evidence_area: "care_planning", grade_indicator: "area_for_development" }),
      ),
    ];
    const g = suggestJudgmentGrade(entries, "overall_experiences");
    expect(g.suggested_grade).toBe("good");
  });

  it("returns requires_improvement for 40-59% strength ratio", () => {
    const entries = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeEvidence({ id: `s-${i}`, evidence_area: "safeguarding", grade_indicator: "strength" }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeEvidence({ id: `d-${i}`, evidence_area: "safeguarding", grade_indicator: "area_for_development" }),
      ),
    ];
    const g = suggestJudgmentGrade(entries, "helped_and_protected");
    expect(g.suggested_grade).toBe("requires_improvement");
  });

  it("returns inadequate for below 40%", () => {
    const entries = [
      makeEvidence({ id: "s1", evidence_area: "staffing_supervision", grade_indicator: "strength" }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeEvidence({ id: `d-${i}`, evidence_area: "staffing_supervision", grade_indicator: "area_for_development" }),
      ),
    ];
    const g = suggestJudgmentGrade(entries, "leadership_and_management");
    expect(g.suggested_grade).toBe("inadequate");
  });

  it("returns low confidence for fewer than 5 entries", () => {
    const entries = [
      makeEvidence({ id: "e1", evidence_area: "care_planning", grade_indicator: "strength" }),
    ];
    const g = suggestJudgmentGrade(entries, "overall_experiences");
    expect(g.confidence).toBe("low");
  });

  it("returns medium confidence for 5-9 entries", () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEvidence({ id: `e-${i}`, evidence_area: "care_planning", grade_indicator: "strength" }),
    );
    const g = suggestJudgmentGrade(entries, "overall_experiences");
    expect(g.confidence).toBe("medium");
  });
});

// -- identifySCCIFAlerts ------------------------------------------------------

describe("identifySCCIFAlerts", () => {
  it("returns empty alerts with current evaluation and full coverage", () => {
    // Create evidence for all areas
    const entries = SCCIF_EVIDENCE_AREAS.map((ea, i) =>
      makeEvidence({ id: `e-${i}`, evidence_area: ea.area, grade_indicator: "strength" }),
    );
    const evals = [makeEvaluation()];
    const alerts = identifySCCIFAlerts(entries, evals);
    // Should not have no_current_evaluation or low_coverage
    expect(alerts.filter((a) => a.type === "no_current_evaluation")).toHaveLength(0);
    expect(alerts.filter((a) => a.type === "low_coverage")).toHaveLength(0);
  });

  it("flags no current evaluation as high", () => {
    const evals = [makeEvaluation({ period_from: "2024-01-01", period_to: "2024-12-31" })];
    const alerts = identifySCCIFAlerts([], evals);
    const noCurrent = alerts.filter((a) => a.type === "no_current_evaluation");
    expect(noCurrent).toHaveLength(1);
    expect(noCurrent[0].severity).toBe("high");
  });

  it("flags low coverage below 75%", () => {
    const entries = [makeEvidence({ evidence_area: "care_planning" })];
    const evals = [makeEvaluation()];
    const alerts = identifySCCIFAlerts(entries, evals);
    const low = alerts.filter((a) => a.type === "low_coverage");
    expect(low).toHaveLength(1);
    expect(low[0].severity).toBe("medium");
  });

  it("flags weak judgment with strength_ratio below 40%", () => {
    // Create evidence heavily weighted to area_for_development for overall_experiences
    const entries = [
      makeEvidence({ id: "s1", evidence_area: "care_planning", grade_indicator: "strength" }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeEvidence({ id: `d-${i}`, evidence_area: "care_planning", grade_indicator: "area_for_development" }),
      ),
    ];
    const evals = [makeEvaluation()];
    const alerts = identifySCCIFAlerts(entries, evals);
    const weak = alerts.filter((a) => a.type === "weak_judgment");
    expect(weak.length).toBeGreaterThanOrEqual(1);
    expect(weak[0].severity).toBe("high");
  });

  it("flags draft too long (older than 30 days)", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const evals = [
      makeEvaluation({
        status: "draft",
        created_at: oldDate.toISOString(),
      }),
    ];
    const alerts = identifySCCIFAlerts([], evals);
    const draft = alerts.filter((a) => a.type === "draft_too_long");
    expect(draft).toHaveLength(1);
    expect(draft[0].severity).toBe("medium");
  });

  it("flags uncovered areas as medium", () => {
    const alerts = identifySCCIFAlerts([], [makeEvaluation()]);
    const uncovered = alerts.filter((a) => a.type === "uncovered_area");
    expect(uncovered).toHaveLength(SCCIF_EVIDENCE_AREAS.length);
    expect(uncovered[0].severity).toBe("medium");
  });
});
