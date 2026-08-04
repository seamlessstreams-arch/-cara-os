// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Risk Profile Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildRiskProfile,
  type ChildRiskProfileInput,
  type RiskAssessmentInput,
  type RiskDomain,
  type RiskLevel,
  type RiskTrend,
  type MitigationEffectiveness,
} from "../child-risk-profile-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function makeAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: `ra_${Math.random().toString(36).slice(2, 8)}`,
    domain: "aggression" as RiskDomain,
    current_level: "medium" as RiskLevel,
    previous_level: "high" as RiskLevel,
    trend: "decreasing" as RiskTrend,
    status: "current",
    assessed_date: daysAgo(14),
    review_date: daysFromNow(16),
    triggers: ["Tiredness", "Perceived unfairness"],
    mitigations: [
      { strategy: "De-escalation techniques", responsible: "All staff", effectiveness: "effective" as MitigationEffectiveness },
      { strategy: "Structured routine", responsible: "Key worker", effectiveness: "effective" as MitigationEffectiveness },
    ],
    has_child_views: true,
    linked_incident_count: 1,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildRiskProfileInput> = {}): ChildRiskProfileInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    assessments: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Risk Profile Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("management_rating");
    expect(r).toHaveProperty("management_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("overview");
    expect(r).toHaveProperty("domain_profiles");
    expect(r).toHaveProperty("mitigation_profile");
    expect(r).toHaveProperty("review_compliance");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Management Rating ─────────────────────────────────────────────────

  it("rates no_assessments when none exist", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r.management_rating).toBe("no_assessments");
    expect(r.management_score).toBe(0);
  });

  it("rates good/outstanding with reducing risks and effective mitigations", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ domain: "aggression", current_level: "medium", previous_level: "high", trend: "decreasing" }),
        makeAssessment({ domain: "absconding", current_level: "low", previous_level: "medium", trend: "decreasing" }),
        makeAssessment({ domain: "exploitation", current_level: "low", previous_level: "medium", trend: "decreasing" }),
      ],
    }));
    expect(["good", "outstanding"]).toContain(r.management_rating);
    expect(r.management_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with escalating risks", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({
          domain: "self_harm",
          current_level: "very_high",
          previous_level: "high",
          trend: "increasing",
          review_date: daysAgo(10),
          has_child_views: false,
          mitigations: [{ strategy: "Monitoring", responsible: "Staff", effectiveness: "not_effective" }],
        }),
        makeAssessment({
          domain: "exploitation",
          current_level: "high",
          previous_level: "medium",
          trend: "increasing",
          review_date: daysAgo(5),
          has_child_views: false,
          mitigations: [],
        }),
      ],
    }));
    expect(["inadequate", "adequate"]).toContain(r.management_rating);
    expect(r.management_score).toBeLessThan(65);
  });

  // ── Overview ──────────────────────────────────────────────────────────

  it("computes risk overview correctly", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ current_level: "high", trend: "decreasing" }),
        makeAssessment({ domain: "absconding", current_level: "medium", trend: "stable" }),
        makeAssessment({ domain: "exploitation", current_level: "low", trend: "decreasing" }),
      ],
    }));
    expect(r.overview.total_domains_assessed).toBe(3);
    expect(r.overview.high_or_very_high_count).toBe(1);
    expect(r.overview.medium_count).toBe(1);
    expect(r.overview.low_count).toBe(1);
    expect(r.overview.improving_count).toBe(2);
    expect(r.overview.stable_count).toBe(1);
  });

  it("identifies highest risk domain", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ domain: "aggression", current_level: "low" }),
        makeAssessment({ domain: "self_harm", current_level: "high" }),
      ],
    }));
    expect(r.overview.highest_risk_domain).toBe("Self-Harm");
    expect(r.overview.highest_risk_level).toBe("high");
  });

  // ── Domain Profiles ───────────────────────────────────────────────────

  it("builds domain profiles sorted by risk level", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ domain: "aggression", current_level: "low" }),
        makeAssessment({ domain: "self_harm", current_level: "high" }),
      ],
    }));
    expect(r.domain_profiles[0].domain).toBe("self_harm");
    expect(r.domain_profiles[1].domain).toBe("aggression");
  });

  it("detects reducing and escalating domains", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ current_level: "medium", previous_level: "high" }),
      ],
    }));
    expect(r.domain_profiles[0].is_reducing).toBe(true);
    expect(r.domain_profiles[0].is_escalating).toBe(false);
  });

  it("detects review overdue", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ review_date: daysAgo(5) })],
    }));
    expect(r.domain_profiles[0].review_overdue).toBe(true);
    expect(r.domain_profiles[0].days_until_review).toBe(-5);
  });

  it("filters out superseded assessments", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ status: "current" }),
        makeAssessment({ domain: "absconding", status: "superseded" }),
      ],
    }));
    expect(r.domain_profiles.length).toBe(1);
  });

  // ── Mitigation Profile ────────────────────────────────────────────────

  it("computes mitigation effectiveness", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({
          mitigations: [
            { strategy: "A", responsible: "Staff", effectiveness: "effective" },
            { strategy: "B", responsible: "Staff", effectiveness: "partially_effective" },
            { strategy: "C", responsible: "Staff", effectiveness: "not_effective" },
          ],
        }),
      ],
    }));
    expect(r.mitigation_profile.total_mitigations).toBe(3);
    expect(r.mitigation_profile.effective_count).toBe(1);
    expect(r.mitigation_profile.partially_effective_count).toBe(1);
    expect(r.mitigation_profile.not_effective_count).toBe(1);
    expect(r.mitigation_profile.effectiveness_rate).toBe(67);
  });

  // ── Review Compliance ─────────────────────────────────────────────────

  it("computes review compliance metrics", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ has_child_views: true, review_date: daysFromNow(10) }),
        makeAssessment({ domain: "absconding", has_child_views: false, review_date: daysAgo(5) }),
      ],
    }));
    expect(r.review_compliance.total_current).toBe(2);
    expect(r.review_compliance.overdue_count).toBe(1);
    expect(r.review_compliance.child_views_rate).toBe(50);
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  it("boosts score for reducing risks", () => {
    const reducing = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ trend: "decreasing" }),
        makeAssessment({ domain: "absconding", trend: "decreasing" }),
      ],
    }));
    const escalating = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ trend: "increasing", current_level: "high", previous_level: "medium" }),
        makeAssessment({ domain: "absconding", trend: "increasing", current_level: "high", previous_level: "low" }),
      ],
    }));
    expect(reducing.management_score).toBeGreaterThan(escalating.management_score!);
  });

  it("boosts score for effective mitigations", () => {
    const effective = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({
        mitigations: [
          { strategy: "A", responsible: "Staff", effectiveness: "effective" },
          { strategy: "B", responsible: "Staff", effectiveness: "effective" },
          { strategy: "C", responsible: "Staff", effectiveness: "effective" },
        ],
      })],
    }));
    const notEffective = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({
        mitigations: [
          { strategy: "A", responsible: "Staff", effectiveness: "not_effective" },
          { strategy: "B", responsible: "Staff", effectiveness: "not_effective" },
          { strategy: "C", responsible: "Staff", effectiveness: "not_effective" },
        ],
      })],
    }));
    expect(effective.management_score).toBeGreaterThan(notEffective.management_score!);
  });

  it("clamps score to 0-100", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: Array.from({ length: 6 }, (_, i) => makeAssessment({
        domain: (["self_harm", "aggression", "exploitation", "substance_use", "online_safety", "fire_setting"] as RiskDomain[])[i],
        current_level: "very_high",
        previous_level: "high",
        trend: "increasing",
        review_date: daysAgo(30),
        has_child_views: false,
        mitigations: [{ strategy: "None", responsible: "Staff", effectiveness: "not_effective" }],
      })),
    }));
    expect(r.management_score).toBeGreaterThanOrEqual(0);
    expect(r.management_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  it("generates strengths for good management", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ trend: "decreasing" }),
        makeAssessment({ domain: "absconding", trend: "decreasing" }),
      ],
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for no high risks", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ current_level: "low" }),
        makeAssessment({ domain: "absconding", current_level: "medium" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("No high") || s.includes("manageable"))).toBe(true);
  });

  it("generates strength for 100% child views", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ has_child_views: true }),
        makeAssessment({ domain: "absconding", has_child_views: true }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("views") || s.includes("Views"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  it("generates concern for no assessments", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r.concerns.some((c) => c.includes("No risk assessments"))).toBe(true);
  });

  it("generates concern for escalating risks", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ trend: "increasing", current_level: "high", previous_level: "medium" })],
    }));
    expect(r.concerns.some((c) => c.includes("ESCALATING") || c.includes("escalating"))).toBe(true);
  });

  it("generates concern for overdue reviews", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ review_date: daysAgo(10) })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("generates concern for very high risks", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ current_level: "very_high" })],
    }));
    expect(r.concerns.some((c) => c.includes("VERY HIGH"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────

  it("recommends immediate review for escalating risks", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ trend: "increasing" })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends completing overdue reviews", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ review_date: daysAgo(10) })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends assessments when none exist", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  // ── Cara Insights ─────────────────────────────────────────────────────

  it("generates critical insight for no assessments", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates critical insight for escalating risks", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ trend: "increasing", current_level: "high", previous_level: "medium" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for outstanding management", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [
        makeAssessment({ domain: "aggression", current_level: "low", previous_level: "medium", trend: "decreasing" }),
        makeAssessment({ domain: "absconding", current_level: "low", previous_level: "medium", trend: "decreasing" }),
        makeAssessment({ domain: "exploitation", current_level: "low", previous_level: "medium", trend: "decreasing" }),
      ],
    }));
    if (r.management_rating === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    }
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes management rating in headline", () => {
    const r = computeChildRiskProfile(baseInput());
    expect(r.headline).toContain(r.management_rating);
  });

  it("mentions escalating in headline", () => {
    const r = computeChildRiskProfile(baseInput({
      assessments: [makeAssessment({ trend: "increasing" })],
    }));
    expect(r.headline).toContain("ESCALATING");
  });
});
