// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CASE FILE AUDIT & QUALITY INTELLIGENCE ENGINE — TESTS
// Tests the pure deterministic engine for case file audit quality, handover
// audits, policy currency, and Ofsted engagement preparedness.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeCaseFileAuditQuality,
  type CaseFileAuditInput,
  type HandoverAuditInput,
  type PolicyReviewInput,
  type OfstedEngagementInput,
  type CaseFileAuditQualityInput,
} from "../home-case-file-audit-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeAudit(overrides: Partial<CaseFileAuditInput> = {}): CaseFileAuditInput {
  return {
    id: `cfa_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    date: TODAY,
    overall_rag: "green",
    overall_score: 90,
    gaps_found: 0,
    child_contributed: true,
    ...overrides,
  };
}

function makeHandoverAudit(overrides: Partial<HandoverAuditInput> = {}): HandoverAuditInput {
  return {
    id: `ha_${Math.random().toString(36).slice(2, 8)}`,
    date: TODAY,
    quality_score: 90,
    actions_completed: true,
    issues_found: 0,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<PolicyReviewInput> = {}): PolicyReviewInput {
  return {
    id: `pol_${Math.random().toString(36).slice(2, 8)}`,
    policy_name: "Safeguarding Policy",
    last_reviewed: TODAY,
    is_current: true,
    staff_aware: true,
    ...overrides,
  };
}

function makeOfsted(overrides: Partial<OfstedEngagementInput> = {}): OfstedEngagementInput {
  return {
    id: `ofs_${Math.random().toString(36).slice(2, 8)}`,
    date: TODAY,
    type: "self_evaluation",
    completed: true,
    actions_arising: 3,
    actions_resolved: 3,
    ...overrides,
  };
}

function baseInput(overrides: Partial<CaseFileAuditQualityInput> = {}): CaseFileAuditQualityInput {
  return {
    today: TODAY,
    total_children: 4,
    case_file_audits: [
      makeAudit({ id: "cfa_1", child_id: "child_1" }),
      makeAudit({ id: "cfa_2", child_id: "child_2" }),
      makeAudit({ id: "cfa_3", child_id: "child_3" }),
      makeAudit({ id: "cfa_4", child_id: "child_4" }),
    ],
    handover_audits: [
      makeHandoverAudit({ id: "ha_1" }),
      makeHandoverAudit({ id: "ha_2" }),
    ],
    policy_reviews: [
      makePolicy({ id: "pol_1", policy_name: "Safeguarding" }),
      makePolicy({ id: "pol_2", policy_name: "Medication" }),
      makePolicy({ id: "pol_3", policy_name: "Fire Safety" }),
      makePolicy({ id: "pol_4", policy_name: "Behaviour Support" }),
    ],
    ofsted_engagement: [
      makeOfsted({ id: "ofs_1", type: "self_evaluation" }),
      makeOfsted({ id: "ofs_2", type: "mock_inspection" }),
      makeOfsted({ id: "ofs_3", type: "evidence_collation" }),
    ],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data with score 0, concerns, recommendations and headline when total_children is 0", () => {
    const r = computeCaseFileAuditQuality(baseInput({ total_children: 0 }));
    expect(r.audit_rating).toBe("insufficient_data");
    expect(r.audit_score).toBe(0);
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.insights.length).toBeGreaterThan(0);
    expect(r.headline).toContain("cannot be assessed");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  it("rates outstanding with full marks — score 82", () => {
    const r = computeCaseFileAuditQuality(baseInput());
    // Base: 52
    // Mod 1: coverage 4/4=100% >=90 → +5
    // Mod 2: greenRate 4/4=100% >=80 → +6, avgScore 90 >=85 → +1 bonus = +7
    // Mod 3: childContribRate 4/4=100% >=80 → +4
    // Mod 4: avgHandoverScore 90 >=85 → +4
    // Mod 5: policyCurrencyRate 4/4=100% >=95 → +5
    // Mod 6: ofstedCompletedRate 3/3=100% >=90 → +5
    // Total: 52+5+7+4+4+5+5 = 82
    expect(r.audit_score).toBe(82);
    expect(r.audit_rating).toBe("outstanding");
  });

  it("has multiple strengths, no concerns, positive insights and Outstanding headline", () => {
    const r = computeCaseFileAuditQuality(baseInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    expect(r.concerns.length).toBe(0);
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    expect(r.headline).toContain("Outstanding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  it("rates good when 4 modifiers at top and 2 degraded slightly — score 71", () => {
    // Keep Mod 1, 4, 5, 6 at top; degrade Mod 2 (green rate) and Mod 3 (child contrib)
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_rag: "green", overall_score: 75, child_contributed: true }),
        makeAudit({ id: "cfa_2", child_id: "child_2", overall_rag: "green", overall_score: 75, child_contributed: true }),
        makeAudit({ id: "cfa_3", child_id: "child_3", overall_rag: "amber", overall_score: 70, child_contributed: false }),
        makeAudit({ id: "cfa_4", child_id: "child_4", overall_rag: "amber", overall_score: 70, child_contributed: false }),
      ],
    }));
    // Base: 52
    // Mod 1: coverage 4/4=100% >=90 → +5
    // Mod 2: greenRate 2/4=50% >=40 → +0; avgScore 72.5 <85 → no bonus = +0
    // Mod 3: childContribRate 2/4=50% >=40 → +0
    // Mod 4: avgHandoverScore 90 >=85 → +4
    // Mod 5: policyCurrencyRate 100% >=95 → +5
    // Mod 6: ofstedCompletedRate 100% >=90 → +5
    // Total: 52+5+0+0+4+5+5 = 71
    expect(r.audit_score).toBe(71);
    expect(r.audit_rating).toBe("good");
    expect(r.headline).toContain("Good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  it("rates inadequate with critical failures — score 31", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_rag: "red", overall_score: 30, child_contributed: false }),
      ],
      handover_audits: [
        makeHandoverAudit({ id: "ha_1", quality_score: 40 }),
      ],
      policy_reviews: [],
      ofsted_engagement: [],
    }));
    // Base: 52
    // Mod 1: coverage 1/4=25% <50 → -5
    // Mod 2: greenRate 0/1=0% <40 → -6; avgScore 30 <85 → no bonus = -6
    // Mod 3: childContribRate 0/1=0% <40 → -4
    // Mod 4: avgHandoverScore 40 <50 → -4
    // Mod 5: no policies → -1
    // Mod 6: no engagements → -1
    // Total: 52-5-6-4-4-1-1 = 31
    expect(r.audit_score).toBe(31);
    expect(r.audit_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
  });

  it("has critical insights and concerns for inadequate data", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_rag: "red", overall_score: 30, child_contributed: false }),
      ],
      handover_audits: [],
      policy_reviews: [],
      ofsted_engagement: [],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Metrics", () => {
  it("counts children_audited from unique child_ids and calculates average_audit_score", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_score: 80 }),
        makeAudit({ id: "cfa_2", child_id: "child_1", overall_score: 60 }),  // duplicate child
        makeAudit({ id: "cfa_3", child_id: "child_2", overall_score: 80 }),
      ],
    }));
    expect(r.children_audited).toBe(2);
    // avgScore = (80+60+80)/3 = 73.3 → rounded to 73.3
    expect(r.average_audit_score).toBeCloseTo(73.3, 0);
  });

  it("calculates green_rag_rate correctly", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_rag: "green" }),
        makeAudit({ id: "cfa_2", child_id: "child_2", overall_rag: "amber" }),
        makeAudit({ id: "cfa_3", child_id: "child_3", overall_rag: "green" }),
        makeAudit({ id: "cfa_4", child_id: "child_4", overall_rag: "red" }),
      ],
    }));
    expect(r.green_rag_rate).toBe(50);
  });

  it("calculates policy_currency_rate and ofsted_readiness_rate", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      policy_reviews: [
        makePolicy({ id: "pol_1", is_current: true }),
        makePolicy({ id: "pol_2", is_current: false }),
        makePolicy({ id: "pol_3", is_current: true }),
        makePolicy({ id: "pol_4", is_current: true }),
      ],
      ofsted_engagement: [
        makeOfsted({ id: "ofs_1", completed: true }),
        makeOfsted({ id: "ofs_2", completed: false }),
        makeOfsted({ id: "ofs_3", completed: true }),
      ],
    }));
    expect(r.policy_currency_rate).toBe(75);
    expect(r.ofsted_readiness_rate).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("highlights audit coverage, green rate, child contribution, and policy currency", () => {
    const r = computeCaseFileAuditQuality(baseInput());
    expect(r.strengths.some(s => s.includes("audit") && s.includes("coverage"))).toBe(true);
    expect(r.strengths.some(s => s.includes("green"))).toBe(true);
    expect(r.strengths.some(s => s.includes("child contribution"))).toBe(true);
    expect(r.strengths.some(s => s.includes("polic"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("flags no case file audits and no policy reviews", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [],
      policy_reviews: [],
    }));
    expect(r.concerns.some(c => c.includes("audit"))).toBe(true);
    expect(r.concerns.some(c => c.includes("polic"))).toBe(true);
  });

  it("flags low green rate and no ofsted engagement", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_rag: "red" }),
      ],
      ofsted_engagement: [],
    }));
    expect(r.concerns.some(c => c.includes("green"))).toBe(true);
    expect(r.concerns.some(c => c.includes("Ofsted"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("generates positive insight for outstanding", () => {
    const r = computeCaseFileAuditQuality(baseInput());
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });

  it("generates critical insight for no audits and warning for low child contribution", () => {
    const noAudits = computeCaseFileAuditQuality(baseInput({ case_file_audits: [] }));
    expect(noAudits.insights.some(i => i.severity === "critical")).toBe(true);

    const lowContrib = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", child_contributed: false }),
        makeAudit({ id: "cfa_2", child_id: "child_2", child_contributed: false }),
        makeAudit({ id: "cfa_3", child_id: "child_3", child_contributed: false }),
      ],
    }));
    expect(lowContrib.insights.some(i => i.severity === "warning")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles no case file audits with children present — not insufficient_data", () => {
    const r = computeCaseFileAuditQuality(baseInput({ case_file_audits: [] }));
    expect(r.children_audited).toBe(0);
    expect(r.average_audit_score).toBe(0);
    expect(r.green_rag_rate).toBe(0);
    expect(r.audit_rating).not.toBe("insufficient_data");
  });

  it("handles empty optional arrays — no handovers (+0), no policies (-1), no engagements (-1)", () => {
    const noHandovers = computeCaseFileAuditQuality(baseInput({ handover_audits: [] }));
    // 52+5+7+4+0+5+5 = 78
    expect(noHandovers.audit_score).toBe(78);

    const noPolicies = computeCaseFileAuditQuality(baseInput({ policy_reviews: [] }));
    // 52+5+7+4+4-1+5 = 76
    expect(noPolicies.audit_score).toBe(76);

    const noOfsted = computeCaseFileAuditQuality(baseInput({ ofsted_engagement: [] }));
    // 52+5+7+4+4+5-1 = 76
    expect(noOfsted.audit_score).toBe(76);
  });

  it("score is clamped to 0-100 and handles duplicate child_ids", () => {
    const r = computeCaseFileAuditQuality(baseInput());
    expect(r.audit_score).toBeLessThanOrEqual(100);
    expect(r.audit_score).toBeGreaterThanOrEqual(0);

    const dupes = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1" }),
        makeAudit({ id: "cfa_2", child_id: "child_1" }),
        makeAudit({ id: "cfa_3", child_id: "child_1" }),
      ],
    }));
    expect(dupes.children_audited).toBe(1);
  });

  it("avgScore bonus: +1 at 85, +0 at 84", () => {
    const noBonus = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_score: 84 }),
        makeAudit({ id: "cfa_2", child_id: "child_2", overall_score: 84 }),
        makeAudit({ id: "cfa_3", child_id: "child_3", overall_score: 84 }),
        makeAudit({ id: "cfa_4", child_id: "child_4", overall_score: 84 }),
      ],
    }));
    // Mod 2: greenRate 100% → +6, avgScore 84 <85 → no bonus = +6
    // Total: 52+5+6+4+4+5+5 = 81
    expect(noBonus.audit_score).toBe(81);

    const withBonus = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [
        makeAudit({ id: "cfa_1", child_id: "child_1", overall_score: 85 }),
        makeAudit({ id: "cfa_2", child_id: "child_2", overall_score: 85 }),
        makeAudit({ id: "cfa_3", child_id: "child_3", overall_score: 85 }),
        makeAudit({ id: "cfa_4", child_id: "child_4", overall_score: 85 }),
      ],
    }));
    // Mod 2: greenRate 100% → +6, avgScore 85 >=85 → +1 bonus = +7
    // Total: 52+5+7+4+4+5+5 = 82
    expect(withBonus.audit_score).toBe(82);
  });

  it("recommendations include regulatory references and are ranked sequentially", () => {
    const r = computeCaseFileAuditQuality(baseInput({
      case_file_audits: [],
      policy_reviews: [],
      ofsted_engagement: [],
    }));
    expect(r.recommendations.some(rec => rec.regulatory_ref === "Reg 40" || rec.regulatory_ref === "Reg 45")).toBe(true);
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});
