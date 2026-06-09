// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SCCIF SELF-EVALUATION INTELLIGENCE ENGINE — TEST SUITE
// Social Care Common Inspection Framework — self-evaluation coverage,
// strength ratios, action completion, evidence gaps, inspection readiness.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSCCIFIntelligence,
  daysBetween,
  isOverdue,
  pct,
  AREA_LABELS,
  type SelfEvaluationAreaInput,
  type SelfEvaluationActionInput,
  type SCCIFIntelligenceInput,
} from "../sccif-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

function makeAction(overrides: Partial<SelfEvaluationActionInput> = {}): SelfEvaluationActionInput {
  return {
    action: "Review care plans",
    owner: "Darren Laville",
    target_date: "2026-06-01",
    status: "open",
    ...overrides,
  };
}

function makeArea(overrides: Partial<SelfEvaluationAreaInput> = {}): SelfEvaluationAreaInput {
  return {
    id: "seva_1",
    area: "overall_experiences",
    self_grade: "good",
    strengths: ["Strong key-working relationships", "Child-centred practice"],
    evidence: ["LAC review minutes", "Key-working session records", "YP feedback"],
    areas_for_development: ["Increase participation in community activities"],
    actions: [makeAction()],
    ...overrides,
  };
}

function makeInput(overrides: Partial<SCCIFIntelligenceInput> = {}): SCCIFIntelligenceInput {
  return {
    areas: [makeArea()],
    today: TODAY,
    ...overrides,
  };
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns correct days between two dates", () => {
    expect(daysBetween("2026-05-18", "2026-05-25")).toBe(7);
  });

  it("is symmetric (order does not matter)", () => {
    expect(daysBetween("2026-05-25", "2026-05-18")).toBe(7);
  });
});

describe("isOverdue", () => {
  it("returns false for completed actions regardless of date", () => {
    expect(isOverdue(makeAction({ status: "completed", target_date: "2026-01-01" }), TODAY)).toBe(false);
  });

  it("returns true for open action past target_date", () => {
    expect(isOverdue(makeAction({ status: "open", target_date: "2026-05-20" }), TODAY)).toBe(true);
  });

  it("returns true for in_progress action past target_date", () => {
    expect(isOverdue(makeAction({ status: "in_progress", target_date: "2026-05-24" }), TODAY)).toBe(true);
  });

  it("returns false for open action with future target_date", () => {
    expect(isOverdue(makeAction({ status: "open", target_date: "2026-06-01" }), TODAY)).toBe(false);
  });

  it("returns false for action due today (not strictly before)", () => {
    expect(isOverdue(makeAction({ status: "open", target_date: "2026-05-25" }), TODAY)).toBe(false);
  });
});

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });
});

// ── Empty Input ──────────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — empty input", () => {
  it("returns zero overview values with no areas", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.overview.total_evidence).toBe(0);
    expect(result.overview.coverage_rate).toBe(0);
    expect(result.overview.strength_ratio).toBe(0);
    expect(result.overview.total_areas).toBe(0);
    expect(result.overview.areas_with_evidence).toBe(0);
    expect(result.overview.inspection_readiness_score).toBe(0);
  });

  it("sets status to draft when no areas", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.overview.status).toBe("draft");
  });

  it("returns empty judgment summaries", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.judgment_summaries).toHaveLength(0);
  });

  it("identifies all 3 judgment areas as evidence gaps", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.evidence_gaps).toHaveLength(3);
    expect(result.evidence_gaps).toContain("Experiences & Progress");
    expect(result.evidence_gaps).toContain("Helped & Protected");
    expect(result.evidence_gaps).toContain("Leadership & Management");
  });

  it("returns zero action tracker", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.action_tracker.total_actions).toBe(0);
    expect(result.action_tracker.completed).toBe(0);
    expect(result.action_tracker.overdue).toBe(0);
    expect(result.action_tracker.completion_rate).toBe(0);
  });

  it("produces no alerts except evidence gaps and coverage", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    // High: coverage < 50% + Medium: evidence gaps
    expect(result.alerts.some((a) => a.severity === "high")).toBe(true);
    expect(result.alerts.some((a) => a.severity === "medium")).toBe(true);
  });
});

// ── Single Area ──────────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — single area", () => {
  it("computes correct judgment summary", () => {
    const result = computeSCCIFIntelligence(makeInput());
    expect(result.judgment_summaries).toHaveLength(1);
    const summary = result.judgment_summaries[0];
    expect(summary.area).toBe("overall_experiences");
    expect(summary.area_label).toBe("Experiences & Progress");
    expect(summary.self_grade).toBe("good");
    expect(summary.strengths_count).toBe(2);
    expect(summary.developments_count).toBe(1);
    expect(summary.evidence_count).toBe(3);
  });

  it("computes strength ratio for single area", () => {
    const result = computeSCCIFIntelligence(makeInput());
    // 2 strengths / (2 + 1) = 67%
    expect(result.judgment_summaries[0].strength_ratio).toBe(67);
  });

  it("sets coverage_rate to 33% with 1 area having evidence", () => {
    const result = computeSCCIFIntelligence(makeInput());
    // 1 area with evidence out of 3 total SCCIF areas = 33%
    expect(result.overview.coverage_rate).toBe(33);
  });

  it("sets status to draft with fewer than 3 areas", () => {
    const result = computeSCCIFIntelligence(makeInput());
    expect(result.overview.status).toBe("draft");
  });

  it("identifies 2 evidence gaps", () => {
    const result = computeSCCIFIntelligence(makeInput());
    expect(result.evidence_gaps).toHaveLength(2);
    expect(result.evidence_gaps).toContain("Helped & Protected");
    expect(result.evidence_gaps).toContain("Leadership & Management");
  });

  it("counts total evidence correctly", () => {
    const result = computeSCCIFIntelligence(makeInput());
    expect(result.overview.total_evidence).toBe(3);
  });
});

// ── Multiple Areas ───────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — multiple areas", () => {
  const threeAreas: SelfEvaluationAreaInput[] = [
    makeArea({ id: "seva_1", area: "overall_experiences" }),
    makeArea({
      id: "seva_2",
      area: "helped_and_protected",
      self_grade: "outstanding",
      strengths: ["Robust safeguarding", "Strong multi-agency work", "Effective risk management"],
      evidence: ["SCR records", "Strategy meeting minutes"],
      areas_for_development: [],
      actions: [makeAction({ status: "completed", target_date: "2026-04-01" })],
    }),
    makeArea({
      id: "seva_3",
      area: "leadership_and_management",
      self_grade: "good",
      strengths: ["Clear vision", "Strong governance"],
      evidence: ["Reg 44 reports", "Staff supervision records", "Training matrix"],
      areas_for_development: ["Improve staff retention"],
      actions: [makeAction({ status: "in_progress", target_date: "2026-07-01" })],
    }),
  ];

  it("returns 3 judgment summaries", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    expect(result.judgment_summaries).toHaveLength(3);
  });

  it("sets coverage_rate to 100% when all 3 areas have evidence", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    expect(result.overview.coverage_rate).toBe(100);
  });

  it("returns no evidence gaps when all areas have evidence", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    expect(result.evidence_gaps).toHaveLength(0);
  });

  it("calculates total evidence across all areas", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    // 3 + 2 + 3 = 8
    expect(result.overview.total_evidence).toBe(8);
  });

  it("calculates overall strength ratio across all areas", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    // Strengths: 2 + 3 + 2 = 7, Developments: 1 + 0 + 1 = 2, Total = 9
    // 7/9 = 78%
    expect(result.overview.strength_ratio).toBe(78);
  });

  it("sets status to in_review when all 3 areas covered but actions still open", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    expect(result.overview.status).toBe("in_review");
  });

  it("produces areas_with_evidence = 3", () => {
    const result = computeSCCIFIntelligence({ areas: threeAreas, today: TODAY });
    expect(result.overview.areas_with_evidence).toBe(3);
  });
});

// ── Status Determination ─────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — status logic", () => {
  it("returns final when all 3 areas covered, all actions completed, 100% coverage", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({
        id: "s1", area: "overall_experiences",
        actions: [makeAction({ status: "completed" })],
      }),
      makeArea({
        id: "s2", area: "helped_and_protected",
        actions: [makeAction({ status: "completed" })],
      }),
      makeArea({
        id: "s3", area: "leadership_and_management",
        actions: [makeAction({ status: "completed" })],
      }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.status).toBe("final");
  });

  it("returns draft when fewer than 3 areas", () => {
    const result = computeSCCIFIntelligence(makeInput());
    expect(result.overview.status).toBe("draft");
  });

  it("returns in_review when 3 areas exist but actions are not all completed", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences", actions: [makeAction({ status: "open" })] }),
      makeArea({ id: "s2", area: "helped_and_protected", actions: [makeAction({ status: "completed" })] }),
      makeArea({ id: "s3", area: "leadership_and_management", actions: [makeAction({ status: "completed" })] }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.status).toBe("in_review");
  });
});

// ── Alert Rules ──────────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — alert rules", () => {
  it("produces critical alert for inadequate area", () => {
    const areas = [makeArea({ self_grade: "inadequate" })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(critical[0].message).toContain("Inadequate");
  });

  it("produces high alert for requires_improvement area", () => {
    const areas = [makeArea({ self_grade: "requires_improvement" })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("Requires Improvement"));
    expect(high.length).toBeGreaterThan(0);
  });

  it("produces high alert when coverage below 50%", () => {
    // Single area with evidence = 33% coverage
    const result = computeSCCIFIntelligence(makeInput());
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("coverage"));
    expect(high.length).toBeGreaterThan(0);
  });

  it("does not produce high coverage alert when coverage is 50%+", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences" }),
      makeArea({ id: "s2", area: "helped_and_protected" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // 2/3 = 67%
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("coverage"));
    expect(high).toHaveLength(0);
  });

  it("produces medium alert for evidence gaps", () => {
    const result = computeSCCIFIntelligence(makeInput());
    const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("gaps"));
    expect(medium.length).toBeGreaterThan(0);
  });

  it("produces medium alert for overdue actions", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-05-01" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("overdue"));
    expect(medium.length).toBeGreaterThan(0);
  });

  it("does not produce overdue alert when all actions are future", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-06-30" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const overdue = result.alerts.filter((a) => a.message.includes("overdue"));
    expect(overdue).toHaveLength(0);
  });

  it("produces low alert when strength ratio below 60% in an area", () => {
    const areas = [makeArea({
      strengths: ["One strength"],
      areas_for_development: ["Dev 1", "Dev 2", "Dev 3"],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // 1/(1+3) = 25%
    const low = result.alerts.filter((a) => a.severity === "low" && a.message.includes("strength ratio"));
    expect(low.length).toBeGreaterThan(0);
  });

  it("does not produce low strength alert when ratio is 60%+", () => {
    const areas = [makeArea({
      strengths: ["S1", "S2", "S3"],
      areas_for_development: ["D1"],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // 3/(3+1) = 75%
    const low = result.alerts.filter((a) => a.severity === "low" && a.message.includes("strength ratio"));
    expect(low).toHaveLength(0);
  });

  it("produces multiple critical alerts for multiple inadequate areas", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences", self_grade: "inadequate" }),
      makeArea({ id: "s2", area: "helped_and_protected", self_grade: "inadequate" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(2);
  });
});

// ── Insight Rules ────────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — insight rules", () => {
  it("produces critical insight for inadequate area", () => {
    const areas = [makeArea({ self_grade: "inadequate" })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(critical[0].text).toContain("Inadequate");
  });

  it("produces warning insight for low coverage", () => {
    const result = computeSCCIFIntelligence(makeInput());
    // 33% coverage < 70%
    const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("coverage"));
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("does not produce low coverage warning when coverage is 70%+", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences" }),
      makeArea({ id: "s2", area: "helped_and_protected" }),
      makeArea({ id: "s3", area: "leadership_and_management" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // 100% coverage
    const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("coverage"));
    expect(warnings).toHaveLength(0);
  });

  it("produces warning insight for overdue actions", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "in_progress", target_date: "2026-05-10" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("past target"));
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("produces positive insight when all areas rated good or outstanding", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences", self_grade: "good" }),
      makeArea({ id: "s2", area: "helped_and_protected", self_grade: "outstanding" }),
      makeArea({ id: "s3", area: "leadership_and_management", self_grade: "good" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("Good or Outstanding"));
    expect(positive.length).toBeGreaterThan(0);
  });

  it("does not produce all-good positive insight when one area is RI", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences", self_grade: "good" }),
      makeArea({ id: "s2", area: "helped_and_protected", self_grade: "requires_improvement" }),
      makeArea({ id: "s3", area: "leadership_and_management", self_grade: "good" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("Good or Outstanding"));
    expect(positive).toHaveLength(0);
  });

  it("produces positive insight for 90%+ coverage and 65%+ strength ratio", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({
        id: "s1", area: "overall_experiences",
        strengths: ["S1", "S2", "S3"],
        areas_for_development: ["D1"],
      }),
      makeArea({
        id: "s2", area: "helped_and_protected",
        strengths: ["S1", "S2"],
        areas_for_development: ["D1"],
      }),
      makeArea({
        id: "s3", area: "leadership_and_management",
        strengths: ["S1", "S2", "S3"],
        areas_for_development: [],
      }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // Coverage: 100%, Strength ratio: 8/(8+2) = 80%
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("Excellent evidence"));
    expect(positive.length).toBeGreaterThan(0);
  });

  it("does not produce coverage/strength positive insight when strength ratio below 65%", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({
        id: "s1", area: "overall_experiences",
        strengths: ["S1"],
        areas_for_development: ["D1", "D2", "D3"],
      }),
      makeArea({
        id: "s2", area: "helped_and_protected",
        strengths: ["S1"],
        areas_for_development: ["D1", "D2"],
      }),
      makeArea({
        id: "s3", area: "leadership_and_management",
        strengths: ["S1"],
        areas_for_development: ["D1", "D2"],
      }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // Coverage: 100%, Strength ratio: 3/(3+7) = 30%
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("Excellent evidence"));
    expect(positive).toHaveLength(0);
  });
});

// ── Action Tracker ───────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — action tracker", () => {
  it("counts total actions correctly", () => {
    const areas = [makeArea({
      actions: [
        makeAction({ status: "open" }),
        makeAction({ status: "completed" }),
        makeAction({ status: "in_progress" }),
      ],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.total_actions).toBe(3);
  });

  it("counts completed actions", () => {
    const areas = [makeArea({
      actions: [
        makeAction({ status: "completed" }),
        makeAction({ status: "completed" }),
        makeAction({ status: "open" }),
      ],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.completed).toBe(2);
  });

  it("counts in_progress actions", () => {
    const areas = [makeArea({
      actions: [
        makeAction({ status: "in_progress" }),
        makeAction({ status: "in_progress" }),
      ],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.in_progress).toBe(2);
  });

  it("counts overdue actions (target_date before today, not completed)", () => {
    const areas = [makeArea({
      actions: [
        makeAction({ status: "open", target_date: "2026-05-01" }),
        makeAction({ status: "in_progress", target_date: "2026-05-20" }),
        makeAction({ status: "completed", target_date: "2026-04-01" }),  // not overdue (completed)
        makeAction({ status: "open", target_date: "2026-06-01" }),       // not overdue (future)
      ],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.overdue).toBe(2);
  });

  it("calculates completion rate", () => {
    const areas = [makeArea({
      actions: [
        makeAction({ status: "completed" }),
        makeAction({ status: "completed" }),
        makeAction({ status: "open" }),
        makeAction({ status: "in_progress" }),
      ],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // 2/4 = 50%
    expect(result.action_tracker.completion_rate).toBe(50);
  });

  it("returns 0 completion rate when no actions", () => {
    const areas = [makeArea({ actions: [] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.completion_rate).toBe(0);
    expect(result.action_tracker.total_actions).toBe(0);
  });

  it("aggregates actions across multiple areas", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", actions: [makeAction({ status: "completed" })] }),
      makeArea({ id: "s2", area: "helped_and_protected", actions: [makeAction({ status: "open" }), makeAction({ status: "in_progress" })] }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.total_actions).toBe(3);
    expect(result.action_tracker.completed).toBe(1);
    expect(result.action_tracker.in_progress).toBe(1);
  });
});

// ── Coverage Calculations ────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — coverage calculations", () => {
  it("coverage is 0% when no areas", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.overview.coverage_rate).toBe(0);
  });

  it("coverage is 33% with 1 area with evidence out of 3", () => {
    const result = computeSCCIFIntelligence(makeInput());
    expect(result.overview.coverage_rate).toBe(33);
  });

  it("coverage is 67% with 2 areas with evidence out of 3", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences" }),
      makeArea({ id: "s2", area: "helped_and_protected" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.coverage_rate).toBe(67);
  });

  it("coverage is 100% with 3 areas all having evidence", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences" }),
      makeArea({ id: "s2", area: "helped_and_protected" }),
      makeArea({ id: "s3", area: "leadership_and_management" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.coverage_rate).toBe(100);
  });

  it("area with empty evidence array does not count towards coverage", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences", evidence: [] }),
      makeArea({ id: "s2", area: "helped_and_protected" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    // Only 1 area with evidence out of 3 = 33%
    expect(result.overview.coverage_rate).toBe(33);
    expect(result.overview.areas_with_evidence).toBe(1);
  });

  it("identifies area with empty evidence in evidence_gaps", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({ id: "s1", area: "overall_experiences", evidence: [] }),
      makeArea({ id: "s2", area: "helped_and_protected" }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.evidence_gaps).toContain("Experiences & Progress");
    expect(result.evidence_gaps).toContain("Leadership & Management");
  });
});

// ── Strength Ratio Edge Cases ────────────────────────────────────────────────

describe("computeSCCIFIntelligence — strength ratio edge cases", () => {
  it("returns 0% when no strengths and no developments across all areas", () => {
    const areas = [makeArea({ strengths: [], areas_for_development: [] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.strength_ratio).toBe(0);
  });

  it("returns 100% when all strengths and no developments", () => {
    const areas = [makeArea({ strengths: ["S1", "S2"], areas_for_development: [] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.strength_ratio).toBe(100);
  });

  it("returns 0% when no strengths but has developments", () => {
    const areas = [makeArea({ strengths: [], areas_for_development: ["D1", "D2"] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.strength_ratio).toBe(0);
  });

  it("returns 50% for equal strengths and developments", () => {
    const areas = [makeArea({
      strengths: ["S1", "S2"],
      areas_for_development: ["D1", "D2"],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.strength_ratio).toBe(50);
  });

  it("per-area strength ratio is 0 when no entries", () => {
    const areas = [makeArea({ strengths: [], areas_for_development: [] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.judgment_summaries[0].strength_ratio).toBe(0);
  });
});

// ── Overdue Action Detection ─────────────────────────────────────────────────

describe("computeSCCIFIntelligence — overdue action detection", () => {
  it("detects actions past target_date with open status", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-05-24" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.overdue).toBe(1);
  });

  it("does not flag completed actions as overdue", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "completed", target_date: "2026-01-01" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.overdue).toBe(0);
  });

  it("detects in_progress actions past target as overdue", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "in_progress", target_date: "2026-05-20" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.overdue).toBe(1);
  });

  it("does not flag actions due today as overdue", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-05-25" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.overdue).toBe(0);
  });

  it("does not flag future actions as overdue", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-12-31" })],
    })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.action_tracker.overdue).toBe(0);
  });

  it("uses injectable today parameter for overdue calculation", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-06-15" })],
    })];
    // With today = 2026-06-20, action is overdue
    const result = computeSCCIFIntelligence({ areas, today: "2026-06-20" });
    expect(result.action_tracker.overdue).toBe(1);
  });
});

// ── Inspection Readiness Score ────────────────────────────────────────────────

describe("computeSCCIFIntelligence — inspection readiness score", () => {
  it("returns 0 for empty input", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.overview.inspection_readiness_score).toBe(0);
  });

  it("returns high score for outstanding areas with full evidence", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({
        id: "s1", area: "overall_experiences", self_grade: "outstanding",
        strengths: ["S1", "S2", "S3", "S4"],
        evidence: ["E1", "E2", "E3", "E4", "E5"],
        areas_for_development: [],
        actions: [makeAction({ status: "completed" })],
      }),
      makeArea({
        id: "s2", area: "helped_and_protected", self_grade: "outstanding",
        strengths: ["S1", "S2", "S3"],
        evidence: ["E1", "E2", "E3", "E4", "E5"],
        areas_for_development: [],
        actions: [makeAction({ status: "completed" })],
      }),
      makeArea({
        id: "s3", area: "leadership_and_management", self_grade: "outstanding",
        strengths: ["S1", "S2", "S3"],
        evidence: ["E1", "E2", "E3", "E4", "E5"],
        areas_for_development: [],
        actions: [makeAction({ status: "completed" })],
      }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.inspection_readiness_score).toBeGreaterThan(90);
  });

  it("returns low score for inadequate areas with no evidence", () => {
    const areas: SelfEvaluationAreaInput[] = [
      makeArea({
        id: "s1", area: "overall_experiences", self_grade: "inadequate",
        strengths: [],
        evidence: [],
        areas_for_development: ["D1", "D2", "D3"],
        actions: [makeAction({ status: "open", target_date: "2026-01-01" })],
      }),
    ];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.overview.inspection_readiness_score).toBeLessThan(20);
  });

  it("readiness increases with better grades", () => {
    const makeGradedInput = (grade: string) => ({
      areas: [
        makeArea({ id: "s1", area: "overall_experiences", self_grade: grade }),
        makeArea({ id: "s2", area: "helped_and_protected", self_grade: grade }),
        makeArea({ id: "s3", area: "leadership_and_management", self_grade: grade }),
      ],
      today: TODAY,
    });
    const goodResult = computeSCCIFIntelligence(makeGradedInput("good"));
    const outstandingResult = computeSCCIFIntelligence(makeGradedInput("outstanding"));
    expect(outstandingResult.overview.inspection_readiness_score).toBeGreaterThan(
      goodResult.overview.inspection_readiness_score
    );
  });
});

// ── Evidence Gaps ────────────────────────────────────────────────────────────

describe("computeSCCIFIntelligence — evidence gaps", () => {
  it("lists all 3 areas as gaps when no areas provided", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.evidence_gaps).toContain("Experiences & Progress");
    expect(result.evidence_gaps).toContain("Helped & Protected");
    expect(result.evidence_gaps).toContain("Leadership & Management");
  });

  it("does not list an area as a gap when it has evidence", () => {
    const areas = [makeArea({ area: "overall_experiences", evidence: ["E1"] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.evidence_gaps).not.toContain("Experiences & Progress");
  });

  it("lists areas that exist but have empty evidence", () => {
    const areas = [makeArea({ area: "overall_experiences", evidence: [] })];
    const result = computeSCCIFIntelligence({ areas, today: TODAY });
    expect(result.evidence_gaps).toContain("Experiences & Progress");
  });

  it("uses human-readable labels not area keys", () => {
    const result = computeSCCIFIntelligence({ areas: [], today: TODAY });
    expect(result.evidence_gaps).not.toContain("overall_experiences");
    expect(result.evidence_gaps).not.toContain("helped_and_protected");
    expect(result.evidence_gaps).not.toContain("leadership_and_management");
  });
});

// ── Area Labels ──────────────────────────────────────────────────────────────

describe("AREA_LABELS", () => {
  it("maps overall_experiences correctly", () => {
    expect(AREA_LABELS["overall_experiences"]).toBe("Experiences & Progress");
  });

  it("maps helped_and_protected correctly", () => {
    expect(AREA_LABELS["helped_and_protected"]).toBe("Helped & Protected");
  });

  it("maps leadership_and_management correctly", () => {
    expect(AREA_LABELS["leadership_and_management"]).toBe("Leadership & Management");
  });
});

// ── Injectable Today Parameter ───────────────────────────────────────────────

describe("computeSCCIFIntelligence — injectable today", () => {
  it("uses provided today parameter", () => {
    const areas = [makeArea({
      actions: [makeAction({ status: "open", target_date: "2026-07-01" })],
    })];
    // Not overdue with today = 2026-05-25
    const result1 = computeSCCIFIntelligence({ areas, today: "2026-05-25" });
    expect(result1.action_tracker.overdue).toBe(0);
    // Overdue with today = 2026-08-01
    const result2 = computeSCCIFIntelligence({ areas, today: "2026-08-01" });
    expect(result2.action_tracker.overdue).toBe(1);
  });

  it("defaults today to current date when not provided", () => {
    const areas = [makeArea({ actions: [] })];
    // Should not throw
    const result = computeSCCIFIntelligence({ areas });
    expect(result.overview).toBeDefined();
  });
});

// ── Full Chamberlain House Integration Scenario ──────────────────────────────────────

describe("computeSCCIFIntelligence — Chamberlain House integration scenario", () => {
  const oakHouseAreas: SelfEvaluationAreaInput[] = [
    {
      id: "seva_oh_1",
      area: "overall_experiences",
      self_grade: "good",
      strengths: [
        "Child-centred key-working practice",
        "Consistent participation in LAC reviews",
        "Strong educational attendance and engagement",
        "Excellent placement stability record",
      ],
      evidence: [
        "Key-work session records (monthly)",
        "LAC review minutes and outcome tracker",
        "PEP and school attendance data",
        "Placement stability metrics (avg 18 months)",
        "YP feedback forms and house meetings",
      ],
      areas_for_development: [
        "Increase community activity participation",
        "Strengthen life-skills programme for 16+ cohort",
      ],
      actions: [
        { action: "Launch community partnership programme", owner: "Darren Laville", target_date: "2026-06-30", status: "in_progress" },
        { action: "Review life-skills assessments for all YP 16+", owner: "Sarah Mitchell", target_date: "2026-05-20", status: "completed" },
      ],
    },
    {
      id: "seva_oh_2",
      area: "helped_and_protected",
      self_grade: "outstanding",
      strengths: [
        "Robust multi-agency safeguarding arrangements",
        "Effective missing-from-care protocols with low episodes",
        "Strong risk assessment and management framework",
        "Children report feeling safe and listened to",
        "Proactive contextual safeguarding approach",
      ],
      evidence: [
        "Multi-agency meeting records",
        "Missing episodes tracker (0 episodes last quarter)",
        "Risk assessment reviews (quarterly)",
        "Children's views survey — 100% feel safe",
        "Contextual safeguarding mapping documents",
        "LADO referral records and outcomes",
      ],
      areas_for_development: [],
      actions: [
        { action: "Complete annual safeguarding training refresh", owner: "All Staff", target_date: "2026-07-31", status: "open" },
      ],
    },
    {
      id: "seva_oh_3",
      area: "leadership_and_management",
      self_grade: "good",
      strengths: [
        "Clear statement of purpose aligned to practice",
        "Strong governance through Reg 44 independent scrutiny",
        "Effective supervision and staff development programme",
      ],
      evidence: [
        "Reg 44 visit reports (monthly)",
        "Supervision records (6-weekly)",
        "Staff training matrix — 95% compliance",
        "Reg 45 quality of care review",
        "Statement of purpose — reviewed annually",
      ],
      areas_for_development: [
        "Reduce agency staff reliance",
        "Improve notification timeliness to Ofsted",
      ],
      actions: [
        { action: "Recruit 2 permanent RSWs", owner: "Darren Laville", target_date: "2026-04-30", status: "completed" },
        { action: "Implement notification checklist", owner: "Sarah Mitchell", target_date: "2026-05-15", status: "completed" },
        { action: "Develop succession planning document", owner: "Darren Laville", target_date: "2026-08-01", status: "open" },
      ],
    },
  ];

  const oakHouseInput: SCCIFIntelligenceInput = { areas: oakHouseAreas, today: TODAY };

  it("produces 3 judgment summaries", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.judgment_summaries).toHaveLength(3);
  });

  it("sets coverage to 100%", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.overview.coverage_rate).toBe(100);
  });

  it("has no evidence gaps", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.evidence_gaps).toHaveLength(0);
  });

  it("correctly counts total evidence", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    // 5 + 6 + 5 = 16
    expect(result.overview.total_evidence).toBe(16);
  });

  it("calculates overall strength ratio", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    // Strengths: 4 + 5 + 3 = 12, Developments: 2 + 0 + 2 = 4, Total = 16
    // 12/16 = 75%
    expect(result.overview.strength_ratio).toBe(75);
  });

  it("tracks all 6 actions", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.action_tracker.total_actions).toBe(6);
  });

  it("counts 3 completed actions", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.action_tracker.completed).toBe(3);
  });

  it("counts 1 in_progress action", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.action_tracker.in_progress).toBe(1);
  });

  it("calculates 50% completion rate", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    // 3/6 = 50%
    expect(result.action_tracker.completion_rate).toBe(50);
  });

  it("detects 0 overdue actions (all future or completed)", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    // target_dates: 2026-06-30 (future), 2026-05-20 (completed), 2026-07-31 (future),
    //              2026-04-30 (completed), 2026-05-15 (completed), 2026-08-01 (future)
    expect(result.action_tracker.overdue).toBe(0);
  });

  it("sets status to in_review (all 3 areas but actions still open)", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.overview.status).toBe("in_review");
  });

  it("produces positive insight for all-good-or-above grades", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("Good or Outstanding"));
    expect(positive).toHaveLength(1);
  });

  it("produces positive insight for excellent coverage and strength ratio", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("Excellent evidence"));
    expect(positive).toHaveLength(1);
  });

  it("produces no critical or warning insights", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    const criticalOrWarning = result.insights.filter((i) => i.severity === "critical" || i.severity === "warning");
    expect(criticalOrWarning).toHaveLength(0);
  });

  it("produces no critical or high alerts", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    const severe = result.alerts.filter((a) => a.severity === "critical" || a.severity === "high");
    expect(severe).toHaveLength(0);
  });

  it("produces high inspection readiness score", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    expect(result.overview.inspection_readiness_score).toBeGreaterThan(70);
  });

  it("correctly labels helped_and_protected as outstanding", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    const hp = result.judgment_summaries.find((s) => s.area === "helped_and_protected");
    expect(hp).toBeDefined();
    expect(hp!.self_grade).toBe("outstanding");
    expect(hp!.area_label).toBe("Helped & Protected");
  });

  it("calculates per-area strength ratio for outstanding area with no developments", () => {
    const result = computeSCCIFIntelligence(oakHouseInput);
    const hp = result.judgment_summaries.find((s) => s.area === "helped_and_protected");
    // 5 strengths / (5 + 0) = 100%
    expect(hp!.strength_ratio).toBe(100);
  });
});
