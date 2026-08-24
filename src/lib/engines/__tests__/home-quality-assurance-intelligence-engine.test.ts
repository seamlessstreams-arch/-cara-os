// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME QUALITY ASSURANCE INTELLIGENCE ENGINE TESTS
// Tests the pure deterministic engine for QA audit coverage, ratings,
// action plan completion, and improvement culture.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeQA,
  type QAAuditInput,
  type QAActionInput,
  type HomeQAInput,
} from "../home-quality-assurance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeAction(overrides: Partial<QAActionInput> = {}): QAActionInput {
  return {
    status: "completed",
    deadline: daysAgo(10),
    ...overrides,
  };
}

function makeAudit(overrides: Partial<QAAuditInput> = {}): QAAuditInput {
  return {
    id: `qa_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(30),
    scope: "safeguarding",
    overall_rating: "good",
    score: 3,
    findings_count: 2,
    strengths_count: 2,
    improvement_areas_count: 1,
    actions: [makeAction()],
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeQAInput> = {}): HomeQAInput {
  return {
    today: TODAY,
    audits: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data when no audits", () => {
    const r = computeHomeQA(baseInput());
    expect(r.qa_rating).toBe("insufficient_data");
    expect(r.qa_score).toBe(0);
  });

  it("returns insufficient_data when all audits outside 12m", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(400) })],
    }));
    expect(r.qa_rating).toBe("insufficient_data");
  });

  it("includes concern and recommendation", () => {
    const r = computeHomeQA(baseInput());
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  function outstandingInput(): HomeQAInput {
    return baseInput({
      audits: [
        makeAudit({ id: "q1", date: daysAgo(10), scope: "medication", overall_rating: "excellent", score: 4, strengths_count: 3, actions: [makeAction(), makeAction()] }),
        makeAudit({ id: "q2", date: daysAgo(45), scope: "safeguarding", overall_rating: "excellent", score: 4, strengths_count: 2, actions: [makeAction()] }),
        makeAudit({ id: "q3", date: daysAgo(90), scope: "recording", overall_rating: "good", score: 3, strengths_count: 2, actions: [makeAction(), makeAction()] }),
        makeAudit({ id: "q4", date: daysAgo(150), scope: "health_safety", overall_rating: "excellent", score: 4, strengths_count: 3, actions: [makeAction()] }),
        makeAudit({ id: "q5", date: daysAgo(200), scope: "care_planning", overall_rating: "good", score: 3, strengths_count: 2, actions: [makeAction()] }),
        makeAudit({ id: "q6", date: daysAgo(300), scope: "fire_safety", overall_rating: "good", score: 3, strengths_count: 2, actions: [makeAction()] }),
      ],
    });
  }

  it("rates outstanding", () => {
    const r = computeHomeQA(outstandingInput());
    // Frequency: 6 → +5
    // Avg score: (4+4+3+4+3+3)/6 = 21/6 = 3.5 → +4
    // Action completion: 9/9 = 100% → +4
    // Overdue: 0 → +3
    // Scope diversity: 6 → +3
    // No inadequate/RI: 0/0 → +3
    // Excellent: 3 → +3
    // Avg strengths: (3+2+2+3+2+2)/6 = 14/6 = 2.3 → ≥2 → +3
    // Total: 52+5+4+4+3+3+3+3+3 = 52+28 = 80
    expect(r.qa_score).toBe(80);
    expect(r.qa_rating).toBe("outstanding");
  });

  it("has strengths in outstanding", () => {
    const r = computeHomeQA(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("has no concerns in outstanding", () => {
    const r = computeHomeQA(outstandingInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has positive insights", () => {
    const r = computeHomeQA(outstandingInput());
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  it("rates good", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ id: "q1", date: daysAgo(30), scope: "medication", overall_rating: "good", score: 3, strengths_count: 2, actions: [makeAction(), makeAction({ status: "in_progress" })] }),
        makeAudit({ id: "q2", date: daysAgo(90), scope: "safeguarding", overall_rating: "excellent", score: 4, strengths_count: 3, actions: [makeAction()] }),
        makeAudit({ id: "q3", date: daysAgo(150), scope: "recording", overall_rating: "requires_improvement", score: 2, strengths_count: 1, actions: [makeAction(), makeAction(), makeAction({ status: "overdue" })] }),
        makeAudit({ id: "q4", date: daysAgo(250), scope: "health_safety", overall_rating: "good", score: 3, strengths_count: 2, actions: [makeAction()] }),
      ],
    }));
    // Frequency: 4 → +3
    // Avg score: (3+4+2+3)/4 = 3 → ≥2.5 → +2
    // Action completion: 5/7 = 71% → ≥60 → +2
    // Overdue: 1 → ≤2 → +1
    // Scope diversity: 4 → ≥3 → +2
    // No inadequate but 1 RI → inadequate=0 → +1
    // Excellent: 1 → +2
    // Avg strengths: (2+3+1+2)/4 = 2 → ≥2 → +3
    // Total: 52+3+2+2+1+2+1+2+3 = 52+16 = 68
    expect(r.qa_score).toBe(68);
    expect(r.qa_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario", () => {
  it("rates adequate with gaps", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ id: "q1", date: daysAgo(60), scope: "safeguarding", overall_rating: "requires_improvement", score: 2, strengths_count: 1, actions: [makeAction({ status: "overdue" }), makeAction({ status: "in_progress" }), makeAction({ status: "pending" })] }),
        makeAudit({ id: "q2", date: daysAgo(180), scope: "recording", overall_rating: "good", score: 3, strengths_count: 1, actions: [makeAction(), makeAction({ status: "overdue" })] }),
      ],
    }));
    // Frequency: 2 → +1
    // Avg score: (2+3)/2 = 2.5 → ≥2.5 → +2
    // Action completion: 1/5 = 20% → <60 → -3
    // Overdue: 2 → ≤2 → +1
    // Scope diversity: 2 → +1
    // No inadequate but 1 RI → +1
    // Excellent: 0 → +0
    // Avg strengths: (1+1)/2 = 1 → ≥1 → +1
    // Total: 52+1+2-3+1+1+1+0+1 = 52+4 = 56
    expect(r.qa_score).toBe(56);
    expect(r.qa_rating).toBe("adequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  it("rates inadequate with critical failures", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ id: "q1", date: daysAgo(60), scope: "safeguarding", overall_rating: "inadequate", score: 1, strengths_count: 0, actions: [makeAction({ status: "overdue" }), makeAction({ status: "overdue" }), makeAction({ status: "overdue" })] }),
      ],
    }));
    // Frequency: 1 → -3
    // Avg score: 1 → <2.5 → -3
    // Action completion: 0/3 = 0% → -3
    // Overdue: 3 → -2
    // Scope: 1 → -1
    // Inadequate: 1 → -3
    // Excellent: 0 → +0
    // Avg strengths: 0 → +0
    // Total: 52-3-3-3-2-1-3+0+0 = 52-15 = 37
    expect(r.qa_score).toBe(37);
    expect(r.qa_rating).toBe("inadequate");
  });

  it("has critical insights", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ date: daysAgo(30), overall_rating: "inadequate", score: 1 }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT COVERAGE PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Audit coverage profile", () => {
  it("counts audits in 12m window", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ date: daysAgo(30) }),
        makeAudit({ date: daysAgo(200) }),
        makeAudit({ date: daysAgo(400) }), // outside
      ],
    }));
    expect(r.audit_coverage.total_audits_12m).toBe(2);
  });

  it("counts unique scopes", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ date: daysAgo(30), scope: "safeguarding" }),
        makeAudit({ date: daysAgo(60), scope: "recording" }),
        makeAudit({ date: daysAgo(90), scope: "safeguarding" }), // dup
      ],
    }));
    expect(r.audit_coverage.unique_scopes).toBe(2);
  });

  it("calculates avg score", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ date: daysAgo(30), score: 4 }),
        makeAudit({ date: daysAgo(60), score: 2 }),
      ],
    }));
    expect(r.audit_coverage.avg_score).toBe(3);
  });

  it("counts ratings", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({ date: daysAgo(30), overall_rating: "excellent" }),
        makeAudit({ date: daysAgo(60), overall_rating: "good" }),
        makeAudit({ date: daysAgo(90), overall_rating: "requires_improvement" }),
        makeAudit({ date: daysAgo(120), overall_rating: "inadequate" }),
      ],
    }));
    expect(r.audit_coverage.excellent_count).toBe(1);
    expect(r.audit_coverage.good_count).toBe(1);
    expect(r.audit_coverage.ri_count).toBe(1);
    expect(r.audit_coverage.inadequate_count).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ACTION PLAN PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Action plan profile", () => {
  it("counts action statuses", () => {
    const r = computeHomeQA(baseInput({
      audits: [
        makeAudit({
          date: daysAgo(30),
          actions: [
            makeAction({ status: "completed" }),
            makeAction({ status: "in_progress" }),
            makeAction({ status: "pending" }),
            makeAction({ status: "overdue" }),
          ],
        }),
      ],
    }));
    expect(r.action_plan.total_actions).toBe(4);
    expect(r.action_plan.completed_count).toBe(1);
    expect(r.action_plan.in_progress_count).toBe(1);
    expect(r.action_plan.overdue_count).toBe(1);
    expect(r.action_plan.completion_rate).toBe(25);
  });

  it("handles no actions", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(30), actions: [] })],
    }));
    expect(r.action_plan.total_actions).toBe(0);
    expect(r.action_plan.completion_rate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STRENGTHS, CONCERNS, RECOMMENDATIONS, INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("highlights high audit frequency", () => {
    const r = computeHomeQA(baseInput({
      audits: Array.from({ length: 6 }, (_, i) => makeAudit({ id: `q${i}`, date: daysAgo(i * 50 + 10), scope: `scope_${i}` })),
    }));
    expect(r.strengths.some(s => s.includes("audit"))).toBe(true);
  });

  it("highlights no overdue actions", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(30), actions: [makeAction()] })],
    }));
    expect(r.strengths.some(s => s.includes("overdue") || s.includes("No overdue"))).toBe(true);
  });
});

describe("Concerns", () => {
  it("flags low audit frequency", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(30) })],
    }));
    expect(r.concerns.some(c => c.includes("audit"))).toBe(true);
  });

  it("flags overdue actions", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(30), actions: [
        makeAction({ status: "overdue" }),
        makeAction({ status: "overdue" }),
        makeAction({ status: "overdue" }),
      ] })],
    }));
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
  });

  it("flags inadequate ratings", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(30), overall_rating: "inadequate", score: 1 })],
    }));
    expect(r.concerns.some(c => c.includes("inadequate"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single audit", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(30) })],
    }));
    expect(r.qa_rating).not.toBe("insufficient_data");
  });

  it("audit at day 365 is included", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(365) })],
    }));
    expect(r.audit_coverage.total_audits_12m).toBe(1);
  });

  it("audit at day 366 is excluded", () => {
    const r = computeHomeQA(baseInput({
      audits: [makeAudit({ date: daysAgo(366) })],
    }));
    expect(r.qa_rating).toBe("insufficient_data");
  });

  it("score is clamped to 0-100", () => {
    const r = computeHomeQA(baseInput({
      audits: Array.from({ length: 10 }, (_, i) =>
        makeAudit({ id: `q${i}`, date: daysAgo(i * 30 + 10), scope: `scope_${i}`, overall_rating: "excellent", score: 4, strengths_count: 3 }),
      ),
    }));
    expect(r.qa_score).toBeLessThanOrEqual(100);
    expect(r.qa_score).toBeGreaterThanOrEqual(0);
  });
});
