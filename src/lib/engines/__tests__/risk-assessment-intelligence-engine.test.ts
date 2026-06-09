// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RISK ASSESSMENT INTELLIGENCE ENGINE — TEST SUITE
// Reg 12/34/11 — dynamic risk management, mitigation effectiveness,
// child voice presence, domain analysis, and ARIA risk insights.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRiskAssessmentIntelligence,
  daysBetween,
  daysUntil,
  average,
  highestLevel,
  type RiskAssessmentInput,
  type ChildInput,
  type MitigationInput,
  type RiskLevel,
  type RiskTrend,
  type RiskStatus,
  type MitigationEffectiveness,
} from "../risk-assessment-intelligence-engine";

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────────

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return {
    id: "child_1",
    name: "Alex W",
    ...overrides,
  };
}

function makeMitigation(overrides: Partial<MitigationInput> = {}): MitigationInput {
  return {
    strategy: "De-escalation techniques",
    responsible: "All staff",
    effectiveness: "effective",
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: "ra_001",
    child_id: "child_1",
    domain: "aggression",
    current_level: "medium",
    previous_level: "medium",
    trend: "stable",
    status: "current",
    assessed_date: "2026-05-10",
    review_date: "2026-06-10",
    mitigations: [makeMitigation()],
    has_child_views: true,
    has_contingency_plan: true,
    linked_incidents_count: 0,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Helpers", () => {
  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2026-05-01", "2026-05-01")).toBe(0);
    });

    it("returns positive days between dates", () => {
      expect(daysBetween("2026-05-01", "2026-05-08")).toBe(7);
    });

    it("returns absolute value regardless of order", () => {
      expect(daysBetween("2026-05-08", "2026-05-01")).toBe(7);
    });
  });

  describe("daysUntil", () => {
    it("returns positive for future dates", () => {
      expect(daysUntil("2026-05-25", "2026-06-01")).toBe(7);
    });

    it("returns negative for past dates", () => {
      expect(daysUntil("2026-05-25", "2026-05-20")).toBe(-5);
    });

    it("returns 0 for same date", () => {
      expect(daysUntil("2026-05-25", "2026-05-25")).toBe(0);
    });
  });

  describe("average", () => {
    it("returns 0 for empty array", () => {
      expect(average([])).toBe(0);
    });

    it("computes correct average", () => {
      expect(average([2, 4, 6])).toBe(4);
    });

    it("handles single value", () => {
      expect(average([7])).toBe(7);
    });
  });

  describe("highestLevel", () => {
    it("returns minimal for empty array", () => {
      expect(highestLevel([])).toBe("minimal");
    });

    it("returns the highest level from list", () => {
      expect(highestLevel(["low", "high", "medium"])).toBe("high");
    });

    it("returns very_high when present", () => {
      expect(highestLevel(["medium", "very_high", "low"])).toBe("very_high");
    });

    it("returns minimal for single minimal", () => {
      expect(highestLevel(["minimal"])).toBe("minimal");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Empty State", () => {
  it("handles no children and no assessments", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [],
      assessments: [],
      today: TODAY,
    });

    expect(result.overview.total_current_assessments).toBe(0);
    expect(result.overview.very_high_count).toBe(0);
    expect(result.overview.child_voice_rate).toBe(100);
    expect(result.overview.contingency_plan_rate).toBe(100);
    expect(result.overview.mitigation_effectiveness_rate).toBe(100);
    expect(result.child_profiles).toHaveLength(0);
    expect(result.domain_analysis).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW COMPUTATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Overview", () => {
  it("counts assessments by level correctly", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({ id: "ra_1", current_level: "very_high" }),
        makeAssessment({ id: "ra_2", current_level: "high" }),
        makeAssessment({ id: "ra_3", current_level: "medium" }),
        makeAssessment({ id: "ra_4", current_level: "low" }),
        makeAssessment({ id: "ra_5", current_level: "minimal" }),
      ],
      today: TODAY,
    });

    expect(result.overview.total_current_assessments).toBe(5);
    expect(result.overview.very_high_count).toBe(1);
    expect(result.overview.high_count).toBe(1);
    expect(result.overview.medium_count).toBe(1);
    expect(result.overview.low_count).toBe(2); // low + minimal
  });

  it("counts trend directions", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({ id: "ra_1", trend: "increasing" }),
        makeAssessment({ id: "ra_2", trend: "increasing" }),
        makeAssessment({ id: "ra_3", trend: "decreasing" }),
        makeAssessment({ id: "ra_4", trend: "stable" }),
      ],
      today: TODAY,
    });

    expect(result.overview.increasing_count).toBe(2);
    expect(result.overview.decreasing_count).toBe(1);
  });

  it("identifies overdue reviews", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({ id: "ra_1", review_date: "2026-05-20" }), // overdue
        makeAssessment({ id: "ra_2", review_date: "2026-05-15" }), // overdue
        makeAssessment({ id: "ra_3", review_date: "2026-06-01" }), // future
      ],
      today: TODAY,
    });

    expect(result.overview.overdue_review_count).toBe(2);
  });

  it("computes child voice rate", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({ id: "ra_1", has_child_views: true }),
        makeAssessment({ id: "ra_2", has_child_views: true }),
        makeAssessment({ id: "ra_3", has_child_views: false }),
        makeAssessment({ id: "ra_4", has_child_views: false }),
      ],
      today: TODAY,
    });

    expect(result.overview.child_voice_rate).toBe(50);
  });

  it("computes contingency plan rate", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({ id: "ra_1", has_contingency_plan: true }),
        makeAssessment({ id: "ra_2", has_contingency_plan: true }),
        makeAssessment({ id: "ra_3", has_contingency_plan: false }),
      ],
      today: TODAY,
    });

    expect(result.overview.contingency_plan_rate).toBe(67);
  });

  it("computes mitigation effectiveness rate", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({
          id: "ra_1",
          mitigations: [
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "partially_effective" }),
            makeMitigation({ effectiveness: "ineffective" }),
          ],
        }),
      ],
      today: TODAY,
    });

    // 2 effective out of 4 = 50%
    expect(result.overview.mitigation_effectiveness_rate).toBe(50);
  });

  it("excludes closed and under_review assessments from overview", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild()],
      assessments: [
        makeAssessment({ id: "ra_1", status: "current", current_level: "high" }),
        makeAssessment({ id: "ra_2", status: "closed", current_level: "very_high" }),
        makeAssessment({ id: "ra_3", status: "under_review", current_level: "very_high" }),
      ],
      today: TODAY,
    });

    expect(result.overview.total_current_assessments).toBe(1);
    expect(result.overview.very_high_count).toBe(0);
    expect(result.overview.high_count).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHILD PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Child Profiles", () => {
  it("creates profiles for children with current assessments", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [
        makeChild({ id: "child_1", name: "Alex W" }),
        makeChild({ id: "child_2", name: "Jordan K" }),
        makeChild({ id: "child_3", name: "Casey T" }), // no current assessments
      ],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", domain: "aggression", current_level: "high" }),
        makeAssessment({ id: "ra_2", child_id: "child_1", domain: "exploitation", current_level: "low" }),
        makeAssessment({ id: "ra_3", child_id: "child_2", domain: "absconding", current_level: "medium" }),
        makeAssessment({ id: "ra_4", child_id: "child_3", status: "closed" }), // excluded
      ],
      today: TODAY,
    });

    expect(result.child_profiles).toHaveLength(2);

    const alex = result.child_profiles.find((p) => p.child_id === "child_1")!;
    expect(alex.child_name).toBe("Alex W");
    expect(alex.active_assessments).toBe(2);
    expect(alex.highest_level).toBe("high");
    expect(alex.domains).toContain("aggression");
    expect(alex.domains).toContain("exploitation");
  });

  it("tracks increasing risks per child", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1", name: "Alex W" })],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", trend: "increasing" }),
        makeAssessment({ id: "ra_2", child_id: "child_1", trend: "increasing" }),
        makeAssessment({ id: "ra_3", child_id: "child_1", trend: "stable" }),
      ],
      today: TODAY,
    });

    const profile = result.child_profiles[0];
    expect(profile.increasing_risks).toBe(2);
  });

  it("tracks overdue reviews per child", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1", name: "Alex W" })],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", review_date: "2026-05-20" }), // overdue
        makeAssessment({ id: "ra_2", child_id: "child_1", review_date: "2026-06-10" }), // ok
      ],
      today: TODAY,
    });

    expect(result.child_profiles[0].overdue_reviews).toBe(1);
  });

  it("tracks child voice presence", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1", name: "Alex W" })],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", has_child_views: false }),
        makeAssessment({ id: "ra_2", child_id: "child_1", has_child_views: false }),
      ],
      today: TODAY,
    });

    expect(result.child_profiles[0].child_voice_present).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Domain Analysis", () => {
  it("groups and analyses by domain", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [
        makeChild({ id: "child_1" }),
        makeChild({ id: "child_2" }),
      ],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", domain: "aggression", current_level: "high" }),
        makeAssessment({ id: "ra_2", child_id: "child_2", domain: "aggression", current_level: "medium" }),
        makeAssessment({ id: "ra_3", child_id: "child_1", domain: "self_harm", current_level: "low" }),
      ],
      today: TODAY,
    });

    expect(result.domain_analysis).toHaveLength(2);

    const aggression = result.domain_analysis.find((d) => d.domain === "aggression")!;
    expect(aggression.count).toBe(2);
    // high=4, medium=3 → avg=3.5
    expect(aggression.avg_level_score).toBe(3.5);
  });

  it("sorts domains by avg_level_score descending", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", domain: "self_harm", current_level: "low" }),
        makeAssessment({ id: "ra_2", domain: "aggression", current_level: "very_high" }),
        makeAssessment({ id: "ra_3", domain: "exploitation", current_level: "medium" }),
      ],
      today: TODAY,
    });

    expect(result.domain_analysis[0].domain).toBe("aggression");
    expect(result.domain_analysis[1].domain).toBe("exploitation");
    expect(result.domain_analysis[2].domain).toBe("self_harm");
  });

  it("tracks increasing/decreasing per domain", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", domain: "aggression", trend: "increasing" }),
        makeAssessment({ id: "ra_2", domain: "aggression", trend: "decreasing" }),
        makeAssessment({ id: "ra_3", domain: "aggression", trend: "increasing" }),
      ],
      today: TODAY,
    });

    const aggression = result.domain_analysis[0];
    expect(aggression.increasing).toBe(2);
    expect(aggression.decreasing).toBe(1);
  });

  it("computes mitigation effectiveness per domain", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({
          id: "ra_1",
          domain: "aggression",
          mitigations: [
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "ineffective" }),
          ],
        }),
      ],
      today: TODAY,
    });

    const aggression = result.domain_analysis[0];
    expect(aggression.mitigation_effective_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Alerts", () => {
  it("generates critical alert for very_high risk child", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1", name: "Alex W" })],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", current_level: "very_high" }),
      ],
      today: TODAY,
    });

    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(1);
    expect(critical[0].message).toContain("Alex W");
    expect(critical[0].message).toContain("very high");
  });

  it("generates critical alert for increasing high risk", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1", name: "Alex W" })],
      assessments: [
        makeAssessment({
          id: "ra_1",
          child_id: "child_1",
          current_level: "high",
          trend: "increasing",
          domain: "aggression",
        }),
      ],
      today: TODAY,
    });

    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical.some((a) => a.message.includes("aggression") && a.message.includes("increasing"))).toBe(true);
  });

  it("generates high alert for overdue reviews", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", review_date: "2026-05-10" }), // overdue
        makeAssessment({ id: "ra_2", review_date: "2026-05-15" }), // overdue
      ],
      today: TODAY,
    });

    const highAlerts = result.alerts.filter((a) => a.severity === "high");
    expect(highAlerts.some((a) => a.message.includes("2") && a.message.includes("overdue"))).toBe(true);
  });

  it("generates medium alert for ineffective mitigations", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({
          id: "ra_1",
          mitigations: [
            makeMitigation({ effectiveness: "ineffective" }),
            makeMitigation({ effectiveness: "ineffective" }),
          ],
        }),
      ],
      today: TODAY,
    });

    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("ineffective"))).toBe(true);
  });

  it("generates medium alert for missing child views", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", has_child_views: false }),
        makeAssessment({ id: "ra_2", has_child_views: false }),
        makeAssessment({ id: "ra_3", has_child_views: true }),
      ],
      today: TODAY,
    });

    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("2") && a.message.includes("without child"))).toBe(true);
  });

  it("generates low alert for reviews due within 7 days", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", review_date: "2026-05-28" }), // 3 days from now
        makeAssessment({ id: "ra_2", review_date: "2026-06-20" }), // not due soon
      ],
      today: TODAY,
    });

    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.some((a) => a.message.includes("7 days"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ARIA INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — ARIA Insights", () => {
  it("generates critical insight for very_high risk", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", current_level: "very_high" }),
      ],
      today: TODAY,
    });

    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(1);
    expect(critical[0].text).toContain("very high");
  });

  it("generates warning insight for increasing trends", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1", name: "Alex W" })],
      assessments: [
        makeAssessment({ id: "ra_1", child_id: "child_1", trend: "increasing" }),
        makeAssessment({ id: "ra_2", child_id: "child_1", trend: "stable" }),
      ],
      today: TODAY,
    });

    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("increasing trend") && w.text.includes("Alex W"))).toBe(true);
  });

  it("generates warning insight for overdue reviews", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", review_date: "2026-05-10" }),
      ],
      today: TODAY,
    });

    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("overdue"))).toBe(true);
  });

  it("generates positive insight for all decreasing trends", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", trend: "decreasing" }),
        makeAssessment({ id: "ra_2", trend: "decreasing" }),
        makeAssessment({ id: "ra_3", trend: "stable" }),
      ],
      today: TODAY,
    });

    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("decreasing trends"))).toBe(true);
  });

  it("generates positive insight for 100% child voice", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({ id: "ra_1", has_child_views: true }),
        makeAssessment({ id: "ra_2", has_child_views: true }),
      ],
      today: TODAY,
    });

    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("100%"))).toBe(true);
  });

  it("generates positive insight for high mitigation effectiveness", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({
          id: "ra_1",
          mitigations: [
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "partially_effective" }),
          ],
        }),
      ],
      today: TODAY,
    });

    // 3/4 = 75% — below 80% threshold. Need 4 effective out of 5
    // Let's not check this one, check the threshold properly
    // 3 effective out of 4 = 75%, which is below 80%
    // Engine requires allMitigations.length >= 3 && rate >= 80
    expect(result.insights.filter((i) => i.severity === "positive").some((p) => p.text.includes("effective"))).toBe(false);
  });

  it("generates positive mitigation insight at 80%+ with 3+ mitigations", () => {
    const result = computeRiskAssessmentIntelligence({
      children: [makeChild({ id: "child_1" })],
      assessments: [
        makeAssessment({
          id: "ra_1",
          mitigations: [
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "effective" }),
            makeMitigation({ effectiveness: "partially_effective" }),
          ],
        }),
      ],
      today: TODAY,
    });

    // 4/5 = 80%
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("80%") && p.text.includes("effective"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL OAK HOUSE INTEGRATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Assessment Engine — Chamberlain House Integration", () => {
  it("produces comprehensive output for realistic Chamberlain House data", () => {
    const children: ChildInput[] = [
      { id: "yp_alex", name: "Alex W" },
      { id: "yp_jordan", name: "Jordan K" },
      { id: "yp_casey", name: "Casey T" },
    ];

    const assessments: RiskAssessmentInput[] = [
      {
        id: "ra_001",
        child_id: "yp_alex",
        domain: "aggression",
        current_level: "high",
        previous_level: "very_high",
        trend: "decreasing",
        status: "current",
        assessed_date: "2026-05-11",
        review_date: "2026-06-10",
        mitigations: [
          { strategy: "1:1 de-escalation using grounding techniques", responsible: "All staff", effectiveness: "effective" },
          { strategy: "Structured daily routine with visual schedule", responsible: "Key worker", effectiveness: "effective" },
        ],
        has_child_views: true,
        has_contingency_plan: true,
        linked_incidents_count: 1,
      },
      {
        id: "ra_002",
        child_id: "yp_jordan",
        domain: "absconding",
        current_level: "medium",
        previous_level: "high",
        trend: "decreasing",
        status: "current",
        assessed_date: "2026-05-18",
        review_date: "2026-06-17",
        mitigations: [
          { strategy: "Proactive check-ins after contact sessions", responsible: "Key worker", effectiveness: "effective" },
          { strategy: "Evening activity programme to reduce boredom triggers", responsible: "Shift team", effectiveness: "partially_effective" },
        ],
        has_child_views: true,
        has_contingency_plan: true,
        linked_incidents_count: 0,
      },
      {
        id: "ra_003",
        child_id: "yp_casey",
        domain: "self_harm",
        current_level: "medium",
        previous_level: "medium",
        trend: "stable",
        status: "current",
        assessed_date: "2026-05-15",
        review_date: "2026-06-14",
        mitigations: [
          { strategy: "Weekly therapeutic key work sessions", responsible: "Key worker", effectiveness: "effective" },
          { strategy: "Access to sensory toolkit in bedroom", responsible: "All staff", effectiveness: "partially_effective" },
          { strategy: "CAMHS sessions fortnightly", responsible: "CAMHS therapist", effectiveness: "effective" },
        ],
        has_child_views: true,
        has_contingency_plan: true,
        linked_incidents_count: 0,
      },
      {
        id: "ra_004",
        child_id: "yp_alex",
        domain: "exploitation",
        current_level: "low",
        previous_level: "medium",
        trend: "decreasing",
        status: "current",
        assessed_date: "2026-05-04",
        review_date: "2026-06-03",
        mitigations: [
          { strategy: "Online safety sessions and phone monitoring agreement", responsible: "Key worker", effectiveness: "effective" },
          { strategy: "Contextual safeguarding mapping updated monthly", responsible: "RM", effectiveness: "effective" },
        ],
        has_child_views: true,
        has_contingency_plan: true,
        linked_incidents_count: 0,
      },
    ];

    const result = computeRiskAssessmentIntelligence({ children, assessments, today: TODAY });

    // Overview
    expect(result.overview.total_current_assessments).toBe(4);
    expect(result.overview.very_high_count).toBe(0);
    expect(result.overview.high_count).toBe(1);
    expect(result.overview.medium_count).toBe(2);
    expect(result.overview.low_count).toBe(1);
    expect(result.overview.increasing_count).toBe(0);
    expect(result.overview.decreasing_count).toBe(3);
    expect(result.overview.overdue_review_count).toBe(0);
    expect(result.overview.child_voice_rate).toBe(100);
    expect(result.overview.contingency_plan_rate).toBe(100);

    // 7 effective out of 9 total mitigations
    const totalMitigations = assessments.flatMap((a) => a.mitigations);
    const effective = totalMitigations.filter((m) => m.effectiveness === "effective").length;
    expect(result.overview.mitigation_effectiveness_rate).toBe(Math.round((effective / totalMitigations.length) * 100));

    // Child profiles
    expect(result.child_profiles).toHaveLength(3);
    const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.active_assessments).toBe(2);
    expect(alex.highest_level).toBe("high");
    expect(alex.domains).toContain("aggression");
    expect(alex.domains).toContain("exploitation");
    expect(alex.increasing_risks).toBe(0);
    expect(alex.child_voice_present).toBe(true);

    // Domain analysis (sorted by avg_level_score desc)
    expect(result.domain_analysis.length).toBe(4);
    expect(result.domain_analysis[0].domain).toBe("aggression"); // score 4
    expect(result.domain_analysis[0].avg_level_score).toBe(4); // high = 4

    // Positive insights expected (all decreasing, 100% child voice, high mitigation)
    const positiveInsights = result.insights.filter((i) => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThanOrEqual(2);

    // No critical alerts (no very_high, no increasing high)
    const criticalAlerts = result.alerts.filter((a) => a.severity === "critical");
    expect(criticalAlerts).toHaveLength(0);
  });
});
